'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _nodeSchedule = require('node-schedule');

var _nodeSchedule2 = _interopRequireDefault(_nodeSchedule);

var _cron = require('cron');

var _hubot = require('hubot');

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Job = function () {
  function Job(jobId, time, timeOrigin, user, room, message, callback) {
    (0, _classCallCheck3.default)(this, Job);

    this.id = jobId;
    this.timePattern = time;
    this.timeOrigin = timeOrigin;

    if (_helpers2.default.isTimeCronPattern(time)) {
      // get cron pattern & timezone
      var _timePattern$split = this.timePattern.split(','),
          _timePattern$split2 = (0, _slicedToArray3.default)(_timePattern$split, 2),
          pattern = _timePattern$split2[0],
          timezone = _timePattern$split2[1];

      pattern = pattern.replace(/\./gi, '*');

      this.timePattern = pattern.trim();

      if (timezone && timezone.trim()) {
        this.timePattern += ', ' + timezone.trim();
      }
    }

    this.user = {
      id: user.id,
      team_id: user.team_id,
      name: user.name,
      room: room || user.room,
      currentRoom: user.room,
      roomName: room,
      roomType: user.roomType
    };

    this.callback = callback;
    this.message = message;
    this.job;
  }

  (0, _createClass3.default)(Job, [{
    key: 'start',
    value: function start(robot) {
      // Cron Pattern
      if (_helpers2.default.isTimeCronPattern(this.timePattern)) {
        var _timePattern$split3 = this.timePattern.split(','),
            _timePattern$split4 = (0, _slicedToArray3.default)(_timePattern$split3, 2),
            pattern = _timePattern$split4[0],
            timezone = _timePattern$split4[1]; // get cron pattern & timezone

        var offsetConfig = timezone ? timezone : _config.envConfig.utcOffset;
        var utcOffset = offsetConfig ? offsetConfig : _helpers2.default.getUTCOffset(new Date());

        return this.job = new _cron.CronJob(pattern, this.sendingHandler.bind(this, robot), null, true, null, null, null, utcOffset);
      } else {
        // Normal Date
        return this.job = _nodeSchedule2.default.scheduleJob(this.timePattern, this.sendingHandler.bind(this, robot));
      }
    }
  }, {
    key: 'sendingHandler',
    value: function sendingHandler(robot) {
      var isDirect = this.user.room.indexOf('@');
      var roomName = this.user.room.trim().replace(/(#|@)/gi, '');

      var envelope = {
        user: this.user,
        room: roomName

        // Direct message
      };if (isDirect > -1 || roomName === 'me') {
        var finalMsg = this.message;
        if (roomName !== 'me' && roomName !== this.user.name) {
          envelope.user.name = roomName;
          finalMsg = ' @' + this.user.name + ' *sends a schedule message to you:*\n' + this.message;
        }
        robot.adapter.sendDirect(envelope, 'Schedule: ' + finalMsg);
      } else {
        robot.send(envelope, 'Schedule: ' + this.message);
      }

      if (_config.envConfig.chainReceiver === '1') {
        robot.adapter.receive(new _hubot.TextMessage(this.user, this.message));
      }

      return typeof this.callback === 'function' ? this.callback() : null;
    }
  }, {
    key: 'cancelSchedule',
    value: function cancelSchedule() {
      if (this.job) {
        _nodeSchedule2.default.cancelJob(this.job);
      }

      return typeof this.callback === 'function' ? this.callback() : null;
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return [this.timePattern, this.user, this.message];
    }
  }]);
  return Job;
}();

exports.default = Job;
module.exports = exports.default;