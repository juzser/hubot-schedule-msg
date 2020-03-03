'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodeSchedule = require('node-schedule');

var _nodeSchedule2 = _interopRequireDefault(_nodeSchedule);

var _cron = require('cron');

var _hubot = require('hubot');

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Job = function () {
  function Job(jobId, time, timeOrigin, user, room, message, callback) {
    _classCallCheck(this, Job);

    this.id = jobId;
    this.timePattern = time;
    this.timeOrigin = timeOrigin;

    if (_helpers2.default.isTimeCronPattern(time)) {
      // get cron pattern & timezone
      var _timePattern$split = this.timePattern.split(','),
          _timePattern$split2 = _slicedToArray(_timePattern$split, 2),
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

  _createClass(Job, [{
    key: 'start',
    value: function start(robot) {
      // Cron Pattern
      if (_helpers2.default.isTimeCronPattern(this.timePattern)) {
        var _timePattern$split3 = this.timePattern.split(','),
            _timePattern$split4 = _slicedToArray(_timePattern$split3, 2),
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