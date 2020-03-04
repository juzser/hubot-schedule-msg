import scheduler from 'node-schedule';
import { CronJob } from 'cron';
import { TextMessage } from 'hubot';

import Helper from './helpers';
import { envConfig } from './config';

export default class Job {
  constructor (jobId, time, timeOrigin, user, room, message, callback) {
    this.id = jobId;
    this.timePattern = time;
    this.timeOrigin = timeOrigin;

    if (Helper.isTimeCronPattern(time)) {
      // get cron pattern & timezone
      let [ pattern, timezone ] = this.timePattern.split(',');
      pattern = pattern.replace(/\./gi, '*');

      this.timePattern = pattern.trim();

      if (timezone && timezone.trim()) {
        this.timePattern += `, ${timezone.trim()}`;
      }
    }

    this.user = {
      id: user.id,
      team_id: user.team_id,
      name: user.name,
      room: room || user.room,
      currentRoom: user.room,
      roomName: room,
      roomType: user.roomType,
    }

    this.callback = callback;
    this.message = message;
    this.job;
  }

  start (robot) {
    // Cron Pattern
    if (Helper.isTimeCronPattern(this.timePattern)) {
      const [ pattern, timezone ] = this.timePattern.split(','); // get cron pattern & timezone

      const offsetConfig = timezone ? timezone : envConfig.utcOffset;
      const utcOffset = offsetConfig ? offsetConfig : Helper.getUTCOffset(new Date());

      return this.job = new CronJob(
        pattern,
        this.sendingHandler.bind(this, robot),
        null, true, null, null, null, utcOffset,
      );
    } else { // Normal Date
      return this.job = scheduler.scheduleJob(
        this.timePattern,
        this.sendingHandler.bind(this, robot),
      );
    }
  }

  sendingHandler (robot) {
    const isDirect = this.user.room.indexOf('@');
    const roomName = this.user.room.trim().replace(/(#|@)/gi, '');

    const envelope = {
      user: this.user,
      room: roomName,
    }

    // Direct message
    if (isDirect > -1 || roomName === 'me') {
      let finalMsg = this.message;
      if (roomName !== 'me' && roomName !== this.user.name) {
        envelope.user.name = roomName;
        finalMsg = ` @${this.user.name} *sends a schedule message to you:*\n${this.message}`;
      }
      robot.adapter.sendDirect(envelope, `Schedule: ${finalMsg}`);
    } else {
      robot.send(envelope, `Schedule: ${this.message}`);
    }

    if (envConfig.chainReceiver === '1') {
      robot.adapter.receive(new TextMessage(this.user, this.message));
    }

    return typeof this.callback === 'function' ? this.callback() : null;
  }

  cancelSchedule () {
    if (this.job) {
      scheduler.cancelJob(this.job);
    }

    return typeof this.callback === 'function' ? this.callback() : null;
  }

  serialize () {
    return [this.timePattern, this.user, this.message];
  };
}
