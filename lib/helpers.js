import CronParser from 'cron-parser';

import { envConfig } from './config';

// get room name by user's message data
const getRoomName = (robot, user) => {
  try {
    return robot.adapter
      .client.rtm.dataStore
      .getChannelGroupOrDMById(user.room).name;
  } catch (_error) {
    return user.room;
  }
};

// Check room is restricted
const isRestrictedRoom = (target, robot, msg) => {
  if (envConfig.ignoreExternalControl === '1') {
    if (target !== getRoomName(robot, msg.message.user)) {
      return true;
    }
  }
  return false;
};

// Check time cron pattern
const isTimeCronPattern = (time) => {
  const timeReplaced = time.toString().replace(/\./gi, '*');
  const [ pattern, ...timezone ] = timeReplaced.split(',');
  const parser = CronParser.parseString(pattern);

  return !Object.keys(parser.errors).length;
}

const compareObj = (source, target) => {
  const sourceObj = source ? source : {};
  const targetObj = target ? target : {};

  const result = {};

  for (let [key, value] of Object.entries(sourceObj)) {
    if (!targetObj[key]) {
      result[key] = value;
    }
  }

  return result;
}

const getUTCOffset = (date) => {
  let offset = -date.getTimezoneOffset();
  let sign = '+';

  if (offset < 0) {
    offset = -offset;
    sign = '-';
  }

  return sign + (offset / 60) + ':' + (offset % 60);
};

const getJobId = (id) => {
  return /(.*)-(\d*)/gi.exec(id);
}

const getJobByUser = (jobs, userId) => {
  const results = {};
  if (jobs) {
    Object.keys(jobs).map((i) => {
      if (userId === getJobId(i)[1]) {
        results[i] = jobs[i];
      }
    });
  }

  return results;
}

export default {
  getRoomName,
  isRestrictedRoom,
  isTimeCronPattern,
  compareObj,
  getUTCOffset,
  getJobId,
  getJobByUser,
};
