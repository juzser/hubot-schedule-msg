require('babel-register');
require('babel-polyfill');

import Job from '../lib/job';
import { AppConfig, envConfig } from '../lib/config';
import Helper from '../lib/helpers';
import { dateParse } from '../lib/dateTimeFormat';

class mainRobot {
  constructor (robot) {
    this.robot = robot;
    this.jobs = {};
    this.isCronPattern = false;
  }

  initial () {
    this.robot.brain.on('loaded', () => {
      return this.syncSchedules();
    });

    // Set storage by key
    if (!this.robot.brain.get(AppConfig.storeKey)) {
      this.robot.brain.set(AppConfig.storeKey, {});
    }

    // hubot schedule <room|user>? "<time>" <message>
    this.robot.respond(/schedule\s?((?:\@|\#|\m\e).*)?\s\"(.*)\" (.*)/i, this.respondNew.bind(this));

    // hubot schedule list
    this.robot.respond(/schedule list/i, this.respondList.bind(this));

    // hubot cancel a schedule
    this.robot.respond(/schedule (?:del|delete|remove|cancel) (\d+)/i, this.respondCancel.bind(this));
  }

  /**
   * Response to the New schedule call
   *
   * @param msg
   */
  respondNew (msg) {
    const target = msg.match[1];

    // Check permission
    if (target && Helper.isRestrictedRoom(target, this.robot, msg)) {
      return msg.send(':warning: Creating schedule for the other room is restricted.');
    }

    const time = msg.match[2];
    const message= msg.match[3];

    // Start create schedule
    return this.schedule(msg, target, time, message);
  }

  /**
   * Response to the List schedule call
   * @param msg
   */
  respondList (msg) {
    const userId = msg.message.user.id;
    const userJobs = Helper.getJobByUser(this.jobs, userId);

    // Create 2 collections of jobs by timePattern
    const dateJobs = {};
    const cronJobs = {};

    for (let [key, job] of Object.entries(userJobs)) {
      if (Helper.isTimeCronPattern(job.timePattern)) {
        cronJobs[key] = job;
      } else {
        dateJobs[key] = job;
      }
    }

    // Reorder jobs by date
    const dateJobsSorted = Object.keys(dateJobs).sort((a, b) => {
      return new Date(dateJobs[a].timePattern) - new Date(dateJobs[b].timePattern);
    });

    let message = '';
    for (let id of dateJobsSorted) {
      const job = dateJobs[id];

      message += `[*${Helper.getJobId(id)[2]}*] Send to ${job.user.roomName}: "${job.message}" at *${job.timeOrigin}*\n`;
    }

    for (let [id, job] of Object.entries(cronJobs)) {
      message += `[*${Helper.getJobId(id)[2]}*] Send to ${job.user.roomName}: "${job.message}" by pattern *${job.timeOrigin}*\n`;
    }

    if (!message) {
      message = 'No messages have been scheduled.';
    }

    const envelope = {
      user: msg.message.user,
      room: msg.message.user.room,
    }

    return this.robot.adapter.sendDirect(envelope, message);
  }

  respondCancel (msg) {
    const id = `${msg.message.user.id}-${msg.match[1]}`;
    const job = this.jobs[id];

    if (!job) {
      return this.errorHandling(msg.message.user, `*${msg.match[1]}*: Schedule not found.`);
    }

    if (Helper.isRestrictedRoom(job.user.room, this.robot, msg)) {
      return this.errorHandling(msg.message.user, 'Canceling schedule for the other room is restricted');
    }

    job.cancelSchedule();
    delete this.jobs[id];
    delete this.robot.brain.get(AppConfig.storeKey)[id];

    return msg.send(`*${msg.match[1]}*: Schedule canceled.`);
  }

  /**
   * Prepare to create the message schedule
   *
   * @param msg
   * @param target room name
   * @param timePattern
   * @param message
   */
  schedule (msg, target, timePattern, message) {
    // over maximum job waiting
    const userJobs = Helper.getJobByUser(this.jobs, msg.message.user.id);
    if (AppConfig.jobMaximumPerUser < userJobs.length) {
      return this.errorHandling(msg.message.user, ':warning: Too many scheduled messages.');
    }

    // Create job id
    let id = null;
    while (!id || this.jobs[id]) {
      id = `${msg.message.user.id}-${Math.floor(Math.random() * AppConfig.jobMaximumPerUser)}`;
    }

    this.isCronPattern = Helper.isTimeCronPattern(timePattern);

    try {
      const job = this.scheduleCreate(id, timePattern, msg.message.user, target, message);

      if (job) {
        return msg.send(`:white_check_mark: :hourglass_flowing_sand: [*${Helper.getJobId(id)[2]}*] Schedule created, trigger ${this.isCronPattern ? 'by pattern' : 'at:'}  *${timePattern}*`);
      }

      return msg.send(`:warning: [*${timePattern}*] is invalid.`);
    } catch (e) {
      return this.errorHandling(msg.message.user, e.message);
    }
  }

  /**
   * Create message schedule by timePattern type
   *
   * @param jobId
   * @param timePattern
   * @param user
   * @param target room name
   * @param message
   */
  scheduleCreate (jobId, timePattern, user, target, message) {
    // Cron date pattern
    if (this.isCronPattern) {
      return this.scheduleStart(jobId, timePattern, timePattern, user, target, message);
    }

    // Normal date pattern schedule
    const dateObj = dateParse(timePattern);
    const dateTimestamp = dateObj.getTime();

    if (!isNaN(dateTimestamp)) {
      if (dateTimestamp < Date.now()) {
        return this.errorHandling(user, `:warning: [*${timePattern}*] has already passed`);
      }

      return this.scheduleStart(jobId, dateObj, timePattern, user, target, message, () => {
        // Remove job after finished
        delete this.jobs[jobId];
        return delete this.robot.brain.get(AppConfig.storeKey)[jobId];
      });
    }
  }

  /**
   * Save schedule & kick off
   *
   * @param jobId
   * @param time cron pattern / timestamp
   * @param user
   * @param target room name
   * @param message
   * @param callback
   */
  scheduleStart (jobId, time, timeOrigin, user, targetRoom, message, callback) {
    // Get target room or current room
    const room = targetRoom ? targetRoom : Helper.getRoomName(this.robot, user);

    const job = new Job(jobId, time, timeOrigin, user, room, message, callback);
    job.start(this.robot);

    this.jobs[jobId] = job;

    return this.robot.brain.get(AppConfig.storeKey)[jobId] = job.serialize();
  }

  syncSchedules () {
    if (!this.robot.brain.get(AppConfig.storeKey)) {
      this.robot.brain.set(AppConfig.storeKey);
    }

    // sync jobs from brain storage to class
    const nonCachedSchedules = Helper.compareObj(this.robot.brain.get(AppConfig.storeKey), this.jobs);

    for (let [ id, job ] of Object.entries(nonCachedSchedules)) {
      scheduleFromBrain(id, job.timeOrigin, job.user, job.message);
    }

    // sync jobs from class to brain storage
    const results = [];
    const nonStoredSchedules = Helper.compareObj(this.jobs, this.robot.brain.get(AppConfig.storeKey));
    for (let [id, job] of Object.entries(nonStoredSchedules)) {
      results.push(storeScheduleInBrain(id, job));
    }

    return results;
  }

  scheduleFromBrain (jobId, timePattern, user, message) {
    const envelope = { user, room: user.room };
    const target = user.room;

    try {
      this.scheduleCreate(jobId, timePattern, user, target, message);
    } catch (e) {
      if (envConfig.debug) {
        return this.errorHandling(user, `${Helper.getJobId(jobId)[2]}: Failed to sync schedule from brain [${e.message}]`);
      }

      return delete this.robot.brain.get(AppConfig.storeKey)[jobId];
    }

    if (envConfig.debug) {
      return this.robot.send(envelope, `${Helper.getJobId(jobId)[2]} scheduled from brain`);
    }
  }

  storeScheduleInBrain (jobId, job) {
    this.robot.brain.get(STORE_KEY)[jobId] = job.serialize();

    const envelope = {
      user: job.user,
      room: job.user.room
    };

    if (config.debug === '1') {
      return this.robot.send(envelope, `${Helper.getJobId(jobId)[2]}: Schedule stored in brain asynchronously`);
    }
  }

  errorHandling (user, e) {
    const envelope = { user };
    if (envConfig.errorEmit === '1') {
      return this.robot.emit('error', e);
    }

    return this.robot.send(envelope, e);
  }
};

module.exports = (robot) => new mainRobot(robot).initial();
