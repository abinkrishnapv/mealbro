
const { DateTime } = require('luxon');

function weekOf(date, timezone) {
  const dt = DateTime.fromJSDate(date, { zone: timezone });
  const start = dt.startOf('week'); 
  return {
    isoYear: start.weekYear,
    isoWeek: start.weekNumber,
    weekStart: start.toISODate(),
    weekEnd: start.plus({ days: 6 }).toISODate()
  };
}

module.exports = { weekOf };