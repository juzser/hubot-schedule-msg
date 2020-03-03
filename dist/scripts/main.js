'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _job4 = require('../lib/job');

var _job5 = _interopRequireDefault(_job4);

var _config = require('../lib/config');

var _helpers = require('../lib/helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _dateTimeFormat = require('../lib/dateTimeFormat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var mainRobot = function () {
  function mainRobot(robot) {
    _classCallCheck(this, mainRobot);

    this.robot = robot;
    this.jobs = {};
    this.isCronPattern = false;
  }

  _createClass(mainRobot, [{
    key: 'initial',
    value: function initial() {
      var _this = this;

      this.robot.brain.on('loaded', function () {
        return _this.syncSchedules();
      });

      // Set storage by key
      if (!this.robot.brain.get(_config.AppConfig.storeKey)) {
        this.robot.brain.set(_config.AppConfig.storeKey, {});
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

  }, {
    key: 'respondNew',
    value: function respondNew(msg) {
      var target = msg.match[1];

      // Check permission
      if (target && _helpers2.default.isRestrictedRoom(target, this.robot, msg)) {
        return msg.send(':warning: Creating schedule for the other room is restricted.');
      }

      var time = msg.match[2];
      var message = msg.match[3];

      // Start create schedule
      return this.schedule(msg, target, time, message);
    }

    /**
     * Response to the List schedule call
     * @param msg
     */

  }, {
    key: 'respondList',
    value: function respondList(msg) {
      var userId = msg.message.user.id;
      var userJobs = _helpers2.default.getJobByUser(this.jobs, userId);

      // Create 2 collections of jobs by timePattern
      var dateJobs = {};
      var cronJobs = {};

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(userJobs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var key = _ref2[0];
          var job = _ref2[1];

          if (_helpers2.default.isTimeCronPattern(job.timePattern)) {
            cronJobs[key] = job;
          } else {
            dateJobs[key] = job;
          }
        }

        // Reorder jobs by date
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

      var dateJobsSorted = Object.keys(dateJobs).sort(function (a, b) {
        return new Date(dateJobs[a].timePattern) - new Date(dateJobs[b].timePattern);
      });

      var message = '';
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = dateJobsSorted[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var id = _step2.value;

          var _job = dateJobs[id];

          message += '[*' + _helpers2.default.getJobId(id)[2] + '*] Send to ' + _job.user.roomName + ': "' + _job.message + '" at *' + _job.timeOrigin + '*\n';
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = Object.entries(cronJobs)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _ref3 = _step3.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var _id = _ref4[0];
          var _job2 = _ref4[1];

          message += '[*' + _helpers2.default.getJobId(_id)[2] + '*] Send to ' + _job2.user.roomName + ': "' + _job2.message + '" by pattern *' + _job2.timeOrigin + '*\n';
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      if (!message) {
        message = 'No messages have been scheduled.';
      }

      var envelope = {
        user: msg.message.user,
        room: msg.message.user.room
      };

      return this.robot.adapter.sendDirect(envelope, message);
    }
  }, {
    key: 'respondCancel',
    value: function respondCancel(msg) {
      var id = msg.message.user.id + '-' + msg.match[1];
      var job = this.jobs[id];

      if (!job) {
        return this.errorHandling(msg.message.user, '*' + msg.match[1] + '*: Schedule not found.');
      }

      if (_helpers2.default.isRestrictedRoom(job.user.room, this.robot, msg)) {
        return this.errorHandling(msg.message.user, 'Canceling schedule for the other room is restricted');
      }

      job.cancelSchedule();
      delete this.jobs[id];
      delete this.robot.brain.get(_config.AppConfig.storeKey)[id];

      return msg.send('*' + msg.match[1] + '*: Schedule canceled.');
    }

    /**
     * Prepare to create the message schedule
     *
     * @param msg
     * @param target room name
     * @param timePattern
     * @param message
     */

  }, {
    key: 'schedule',
    value: function schedule(msg, target, timePattern, message) {
      // over maximum job waiting
      var userJobs = _helpers2.default.getJobByUser(this.jobs, msg.message.user.id);
      if (_config.AppConfig.jobMaximumPerUser < userJobs.length) {
        return this.errorHandling(msg.message.user, ':warning: Too many scheduled messages.');
      }

      // Create job id
      var id = null;
      while (!id || this.jobs[id]) {
        id = msg.message.user.id + '-' + Math.floor(Math.random() * _config.AppConfig.jobMaximumPerUser);
      }

      this.isCronPattern = _helpers2.default.isTimeCronPattern(timePattern);

      try {
        var job = this.scheduleCreate(id, timePattern, msg.message.user, target, message);

        if (job) {
          return msg.send(':white_check_mark: :hourglass_flowing_sand: [*' + _helpers2.default.getJobId(id)[2] + '*] Schedule created, trigger ' + (this.isCronPattern ? 'by pattern' : 'at:') + '  *' + timePattern + '*');
        }

        return msg.send(':warning: [*' + timePattern + '*] is invalid.');
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

  }, {
    key: 'scheduleCreate',
    value: function scheduleCreate(jobId, timePattern, user, target, message) {
      var _this2 = this;

      // Cron date pattern
      if (this.isCronPattern) {
        return this.scheduleStart(jobId, timePattern, timePattern, user, target, message);
      }

      // Normal date pattern schedule
      var dateObj = (0, _dateTimeFormat.dateParse)(timePattern);
      var dateTimestamp = dateObj.getTime();

      if (!isNaN(dateTimestamp)) {
        if (dateTimestamp < Date.now()) {
          return this.errorHandling(user, ':warning: [*' + timePattern + '*] has already passed');
        }

        return this.scheduleStart(jobId, dateObj, timePattern, user, target, message, function () {
          // Remove job after finished
          delete _this2.jobs[jobId];
          return delete _this2.robot.brain.get(_config.AppConfig.storeKey)[jobId];
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

  }, {
    key: 'scheduleStart',
    value: function scheduleStart(jobId, time, timeOrigin, user, targetRoom, message, callback) {
      // Get target room or current room
      var room = targetRoom ? targetRoom : _helpers2.default.getRoomName(this.robot, user);

      var job = new _job5.default(jobId, time, timeOrigin, user, room, message, callback);
      job.start(this.robot);

      this.jobs[jobId] = job;

      return this.robot.brain.get(_config.AppConfig.storeKey)[jobId] = job.serialize();
    }
  }, {
    key: 'syncSchedules',
    value: function syncSchedules() {
      if (!this.robot.brain.get(_config.AppConfig.storeKey)) {
        this.robot.brain.set(_config.AppConfig.storeKey);
      }

      // sync jobs from brain storage to class
      var nonCachedSchedules = _helpers2.default.compareObj(this.robot.brain.get(_config.AppConfig.storeKey), this.jobs);

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = Object.entries(nonCachedSchedules)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _ref5 = _step4.value;

          var _ref6 = _slicedToArray(_ref5, 2);

          var id = _ref6[0];
          var job = _ref6[1];

          scheduleFromBrain(id, job.timeOrigin, job.user, job.message);
        }

        // sync jobs from class to brain storage
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var results = [];
      var nonStoredSchedules = _helpers2.default.compareObj(this.jobs, this.robot.brain.get(_config.AppConfig.storeKey));
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = Object.entries(nonStoredSchedules)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _ref7 = _step5.value;

          var _ref8 = _slicedToArray(_ref7, 2);

          var _id2 = _ref8[0];
          var _job3 = _ref8[1];

          results.push(storeScheduleInBrain(_id2, _job3));
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      return results;
    }
  }, {
    key: 'scheduleFromBrain',
    value: function scheduleFromBrain(jobId, timePattern, user, message) {
      var envelope = { user: user, room: user.room };
      var target = user.room;

      try {
        this.scheduleCreate(jobId, timePattern, user, target, message);
      } catch (e) {
        if (_config.envConfig.debug) {
          return this.errorHandling(user, _helpers2.default.getJobId(jobId)[2] + ': Failed to sync schedule from brain [' + e.message + ']');
        }

        return delete this.robot.brain.get(_config.AppConfig.storeKey)[jobId];
      }

      if (_config.envConfig.debug) {
        return this.robot.send(envelope, _helpers2.default.getJobId(jobId)[2] + ' scheduled from brain');
      }
    }
  }, {
    key: 'storeScheduleInBrain',
    value: function storeScheduleInBrain(jobId, job) {
      this.robot.brain.get(STORE_KEY)[jobId] = job.serialize();

      var envelope = {
        user: job.user,
        room: job.user.room
      };

      if (config.debug === '1') {
        return this.robot.send(envelope, _helpers2.default.getJobId(jobId)[2] + ': Schedule stored in brain asynchronously');
      }
    }
  }, {
    key: 'errorHandling',
    value: function errorHandling(user, e) {
      var envelope = { user: user };
      if (_config.envConfig.errorEmit === '1') {
        return this.robot.emit('error', e);
      }

      return this.robot.send(envelope, e);
    }
  }]);

  return mainRobot;
}();

;

module.exports = function (robot) {
  return new mainRobot(robot).initial();
};