/**
 * Split a date object into day, month and year and format for output.
 * The month is written out in full.
 *
 * @param {Date} date A Date object.
 * @returns {string} Returns a string containing the day, month and year.
 */
export const formatDateForEmail = (date) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString();

  return `${day} ${month} ${year}`;
};

export const formatRegId = (id) => {
  return `NS-TRP-${String(id).padStart(5, '0')}`;
};

export function addDaysAndSetTime(date, days, hours, mins, seconds) {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  newDate.setHours(hours, mins, seconds);

  return newDate;
}
