'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toArray2 = require('babel-runtime/helpers/toArray');

var _toArray3 = _interopRequireDefault(_toArray2);

var _cronParser = require('cron-parser');

var _cronParser2 = _interopRequireDefault(_cronParser);

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// get room name by user's message data
var getRoomName = function getRoomName(robot, user) {
  try {
    return robot.adapter.client.rtm.dataStore.getChannelGroupOrDMById(user.room).name;
  } catch (_error) {
    return user.room;
  }
};

// Check room is restricted
var isRestrictedRoom = function isRestrictedRoom(target, robot, msg) {
  if (_config.envConfig.ignoreExternalControl === '1') {
    if (target !== getRoomName(robot, msg.message.user)) {
      return true;
    }
  }
  return false;
};

// Check time cron pattern
var isTimeCronPattern = function isTimeCronPattern(time) {
  var timeReplaced = time.toString().replace(/\./gi, '*');

  var _timeReplaced$split = timeReplaced.split(','),
      _timeReplaced$split2 = (0, _toArray3.default)(_timeReplaced$split),
      pattern = _timeReplaced$split2[0],
      timezone = _timeReplaced$split2.slice(1);

  var parser = _cronParser2.default.parseString(pattern);

  return !(0, _keys2.default)(parser.errors).length;
};

var compareObj = function compareObj(source, target) {
  var sourceObj = source ? source : {};
  var targetObj = target ? target : {};

  var result = {};

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)((0, _entries2.default)(sourceObj)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = (0, _slicedToArray3.default)(_step.value, 2),
          key = _step$value[0],
          value = _step$value[1];

      if (!targetObj[key]) {
        result[key] = value;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return result;
};

var getUTCOffset = function getUTCOffset(date) {
  var offset = -date.getTimezoneOffset();
  var sign = '+';

  if (offset < 0) {
    offset = -offset;
    sign = '-';
  }

  return sign + offset / 60 + ':' + offset % 60;
};

var getJobId = function getJobId(id) {
  return (/(.*)-(\d*)/gi.exec(id)
  );
};

var getJobByUser = function getJobByUser(jobs, userId) {
  var results = {};
  if (jobs) {
    (0, _keys2.default)(jobs).map(function (i) {
      if (userId === getJobId(i)[1]) {
        results[i] = jobs[i];
      }
    });
  }

  return results;
};

exports.default = {
  getRoomName: getRoomName,
  isRestrictedRoom: isRestrictedRoom,
  isTimeCronPattern: isTimeCronPattern,
  compareObj: compareObj,
  getUTCOffset: getUTCOffset,
  getJobId: getJobId,
  getJobByUser: getJobByUser
};
module.exports = exports.default;