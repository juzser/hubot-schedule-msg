'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _cronParser = require('cron-parser');

var _cronParser2 = _interopRequireDefault(_cronParser);

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

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
      _timeReplaced$split2 = _toArray(_timeReplaced$split),
      pattern = _timeReplaced$split2[0],
      timezone = _timeReplaced$split2.slice(1);

  var parser = _cronParser2.default.parseString(pattern);

  return !Object.keys(parser.errors).length;
};

var compareObj = function compareObj(source, target) {
  var sourceObj = source ? source : {};
  var targetObj = target ? target : {};

  var result = {};

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.entries(sourceObj)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
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
    Object.keys(jobs).map(function (i) {
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