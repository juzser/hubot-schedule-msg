export const envConfig = {
  debug: process.env.HUBOT_SCHEDULE_DEBUG || 1,
  chainReceiver: process.env.HUBOT_SCHEDULE_CHAIN_RECEIVER || '1',
  ignoreExternalControl: process.env.HUBOT_SCHEDULE_IGNORE_EXTERNAL_CONTROL || 0,
  utcOffset: process.env.HUBOT_SCHEDULE_UTC_OFFSET || '+00:00',
  errorEmit: process.env.HUBOT_SCHEDULE_EMIT_ERROR || 0,
};

export const AppConfig = {
  jobMaximumPerUser: 500,
  storeKey: 'hubot_schedule_msg',
};
