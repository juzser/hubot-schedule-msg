import { envConfig } from './config';

const weekdayShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const weekdayFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthFull = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * Parse any date time format to correct JS Date
 *
 * @param timeSource string of date/time
 * @returns new Date()
 */
const dateParse = (timeSource) => {
  // get Timezone patterns
  const tzPattern = /(?:\s|\,)((?:\+|\-)(?:\d|:)*)/gi;
  const tzGetPattern = /(.*)(?:\s|\,)((?:\+|\-)(?:\d|:)*)/gi;
  let timezone = envConfig.utcOffset;
  let timeSourceWithoutTz = timeSource;

  // Check if timezone is defined
  if (tzPattern.test(timeSource)) {
    timezone = timeSource.replace(tzGetPattern, (match, g1, g2) => {
      timeSourceWithoutTz = g1;
      return g2;
    });
  }

  // split to get datetime
  const timeSplit = timeSourceWithoutTz.split(' ');
  const dateArr = [];
  let timeFormated = null;

  timeSplit.map((value) => {
    if (/(?<!(\+|\-)\d*)(:|am|pm)/gi.test(value)) {
      timeFormated = timeFormat(value, timezone);
    } else {
      dateArr.push(value);
    }
  });

  const dateFormated = dateFormat(dateArr);
  const dateTime = Object.assign({}, timeFormated, dateFormated);

  const parseDate = new Date(
    dateTime.year,
    dateTime.month,
    dateTime.day,
    dateTime.hour || 9,
    dateTime.minute || 0,
    dateTime.second || 0,
  );

  return parseDate;
}

// Get time object
const timeFormat = (time, tz) => {
  let [ hour, minute, second ] = time.replace(/(\s*(?:am|pm))/gi, '').split(':');

  if (/(am|pm)/gi.test(time)) { // hh:mm? am|pm
    hour = /pm/gi.test(time)
      ? parseInt(hour) + 12
      : hour;
  }

  // Set default value at 9:00
  hour = parseInt(hour) || 9;
  minute = parseInt(minute) || 0;
  second = parseInt(second) || 0;

  // Resolve timezone
  const [ tzHour, tzMinute ] = tz.split(':');
  if (tzHour.indexOf('-') > -1) {
    hour += parseInt(tzHour);
    minute += (parseInt(tzMinute) || 0);
  } else {
    hour -= parseInt(tzHour);
    minute -= (parseInt(tzMinute) || 0);
  }

  return { hour, minute, second };
}

// Get date object
const dateFormat = (dateArr) => {
  const currentDate = new Date();
  const todayDate = currentDate.getDate();
  let day, month, year;

  // Full format separate by - or /
  if (/(\/|\-)/gi.test(dateArr[0])) {
    const datePieces = (dateArr[0].indexOf('/') > -1)
      ? dateArr[0].split('/')
      : dateArr[0].split('-');

    if (datePieces[0].length === 4) {
      [ year, month, day ] = datePieces;
    } else {
      [ day, month, year ] = datePieces;
    }

    day = parseInt(day);
    month = parseInt(month) - 1;
    year = parseInt(year);
  } else { // Free format
    const monthCollection = [...monthShort, ...monthFull];
    const weekdayCollection = [...weekdayShort, ...weekdayFull];

    const dateFilter = dateArr.filter((el) => {
      const lowerEl = el.toLowerCase();

      const monIndex = monthCollection.indexOf(lowerEl);
      const dayIndex = weekdayCollection.indexOf(lowerEl);

      // Month
      if (monIndex > -1) {
        month = monIndex > 11 ? monIndex - 12 : monIndex;
        return false;
      }

      // Day
      if (dayIndex > -1) {
        const weekdayNumber = dayIndex > 6 ? dayIndex - 6 : dayIndex;
        const todayNumber = currentDate.getDay();

        day = todayDate + (weekdayNumber - todayNumber + (weekdayNumber > todayNumber ? 0 : 7)); // get next weekday from today

        return false;
      }

      if (lowerEl === 'tomorrow' || lowerEl === 'tmr') {
        day = todayDate + 1;
        return false;
      }

      return el;
    });

    dateFilter.map((el) => {
        if (el.length === 4) { // yyyy
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
    month: (typeof month === 'number') ? month : currentDate.getMonth(),
    day: day || todayDate,
  }
}

export default {
  dateParse,
};
