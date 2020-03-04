'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _config = require('./config');

var weekdayShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
var weekdayFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
var monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
var monthFull = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * Parse any date time format to correct JS Date
 *
 * @param timeSource string of date/time
 * @returns new Date()
 */
var dateParse = function dateParse(timeSource) {
  // get Timezone patterns
  var tzPattern = /(?:\s|\,)((?:\+|\-)(?:\d|:)*)/gi;
  var tzGetPattern = /(.*)(?:\s|\,)((?:\+|\-)(?:\d|:)*)/gi;
  var timezone = _config.envConfig.utcOffset;
  var timeSourceWithoutTz = timeSource;

  // Check if timezone is defined
  if (tzPattern.test(timeSource)) {
    timezone = timeSource.replace(tzGetPattern, function (match, g1, g2) {
      timeSourceWithoutTz = g1;
      return g2;
    });
  }

  // split to get datetime
  var timeSplit = timeSourceWithoutTz.split(' ');
  var dateArr = [];
  var timeFormated = null;

  timeSplit.map(function (value) {
    if (/(?<!(\+|\-)\d*)(:|am|pm)/gi.test(value)) {
      timeFormated = timeFormat(value, timezone);
    } else {
      dateArr.push(value);
    }
  });

  var dateFormated = dateFormat(dateArr);
  var dateTime = Object.assign({}, timeFormated, dateFormated);

  var parseDate = new Date(dateTime.year, dateTime.month, dateTime.day, dateTime.hour || 9, dateTime.minute || 0, dateTime.second || 0);

  return parseDate;
};

// Get time object
var timeFormat = function timeFormat(time, tz) {
  var _time$replace$split = time.replace(/(\s*(?:am|pm))/gi, '').split(':'),
      _time$replace$split2 = _slicedToArray(_time$replace$split, 3),
      hour = _time$replace$split2[0],
      minute = _time$replace$split2[1],
      second = _time$replace$split2[2];

  if (/(am|pm)/gi.test(time)) {
    // hh:mm? am|pm
    hour = /pm/gi.test(time) ? parseInt(hour) + 12 : hour;
  }

  // Set default value at 9:00
  hour = parseInt(hour) || 9;
  minute = parseInt(minute) || 0;
  second = parseInt(second) || 0;

  // Resolve timezone

  var _tz$split = tz.split(':'),
      _tz$split2 = _slicedToArray(_tz$split, 2),
      tzHour = _tz$split2[0],
      tzMinute = _tz$split2[1];

  if (tzHour.indexOf('-') > -1) {
    hour += parseInt(tzHour);
    minute += parseInt(tzMinute) || 0;
  } else {
    hour -= parseInt(tzHour);
    minute -= parseInt(tzMinute) || 0;
  }

  return { hour: hour, minute: minute, second: second };
};

// Get date object
var dateFormat = function dateFormat(dateArr) {
  var currentDate = new Date();
  var todayDate = currentDate.getDate();
  var day = void 0,
      month = void 0,
      year = void 0;

  // Full format separate by - or /
  if (/(\/|\-)/gi.test(dateArr[0])) {
    var datePieces = dateArr[0].indexOf('/') > -1 ? dateArr[0].split('/') : dateArr[0].split('-');

    if (datePieces[0].length === 4) {
      var _datePieces = _slicedToArray(datePieces, 3);

      year = _datePieces[0];
      month = _datePieces[1];
      day = _datePieces[2];
    } else {
      var _datePieces2 = _slicedToArray(datePieces, 3);

      day = _datePieces2[0];
      month = _datePieces2[1];
      year = _datePieces2[2];
    }

    day = parseInt(day);
    month = parseInt(month) - 1;
    year = parseInt(year);
  } else {
    // Free format
    var monthCollection = [].concat(monthShort, monthFull);
    var weekdayCollection = [].concat(weekdayShort, weekdayFull);

    var dateFilter = dateArr.filter(function (el) {
      var lowerEl = el.toLowerCase();

      var monIndex = monthCollection.indexOf(lowerEl);
      var dayIndex = weekdayCollection.indexOf(lowerEl);

      // Month
      if (monIndex > -1) {
        month = monIndex > 11 ? monIndex - 12 : monIndex;
        return false;
      }

      // Day
      if (dayIndex > -1) {
        var weekdayNumber = dayIndex > 6 ? dayIndex - 6 : dayIndex;
        var todayNumber = currentDate.getDay();

        day = todayDate + (weekdayNumber - todayNumber + (weekdayNumber > todayNumber ? 0 : 7)); // get next weekday from today

        return false;
      }

      if (lowerEl === 'tomorrow' || lowerEl === 'tmr') {
        day = todayDate + 1;
        return false;
      }

      return el;
    });

    dateFilter.map(function (el) {
      if (el.length === 4) {
        // yyyy
        year = el;
        return;
      };

      if (typeof day !== 'number') {
        day = el;
        return;
      };

      if (typeof month !== 'number') {
        month = el;
        return;
      };
    });
  }

  return {
    year: year || currentDate.getFullYear(),
    month: typeof month === 'number' ? month : currentDate.getMonth(),
    day: day || todayDate
  };
};

exports.default = {
  dateParse: dateParse
};