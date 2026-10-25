/**
 * Formats a Date object or string into YYYY-MM-DD format
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a date falls on a weekend
 * @param {Date|string} date
 * @param {number[]} weekendDays - array of day numbers (0=Sun, 6=Sat)
 * @returns {boolean}
 */
export const isWeekend = (date, weekendDays = [0, 6]) => {
  const d = new Date(date);
  return weekendDays.includes(d.getDay());
};

/**
 * Checks if a date falls on a configured holiday
 * @param {Date|string} date
 * @param {Array<string|{date: string}>} holidays
 * @returns {boolean}
 */
export const isHoliday = (date, holidays = []) => {
  const dateStr = formatDateStr(date);
  return holidays.some((h) => {
    const hDateStr = typeof h === 'string' ? h : formatDateStr(h.date);
    return hDateStr === dateStr;
  });
};

/**
 * Calculates working days between startDate and endDate inclusive
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {number[]} weekendDays
 * @param {Array<string|{date: string}>} holidays
 * @returns {{ workingDays: number, totalDays: number, workingDateList: string[], holidayDates: string[], weekendDates: string[] }}
 */
export const calculateWorkingDays = (
  startDate,
  endDate,
  weekendDays = [0, 6],
  holidays = []
) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (start > end) {
    return {
      workingDays: 0,
      totalDays: 0,
      workingDateList: [],
      holidayDates: [],
      weekendDates: [],
    };
  }

  const holidaySet = new Set(
    holidays.map((h) => (typeof h === 'string' ? h : formatDateStr(h.date)))
  );

  const workingDateList = [];
  const holidayDates = [];
  const weekendDates = [];

  const curr = new Date(start);
  let totalDays = 0;

  while (curr <= end) {
    totalDays++;
    const dateStr = formatDateStr(curr);
    const dayOfWeek = curr.getDay();

    if (weekendDays.includes(dayOfWeek)) {
      weekendDates.push(dateStr);
    } else if (holidaySet.has(dateStr)) {
      holidayDates.push(dateStr);
    } else {
      workingDateList.push(dateStr);
    }

    curr.setDate(curr.getDate() + 1);
  }

  return {
    workingDays: workingDateList.length,
    totalDays,
    workingDateList,
    holidayDates,
    weekendDates,
  };
};

/**
 * Gets all expected working days for a specific year and month
 * @param {number} year
 * @param {number} month - 1 to 12
 * @param {number[]} weekendDays
 * @param {Array<string|{date: string}>} holidays
 * @returns {{ workingDays: number, workingDateList: string[] }}
 */
export const getMonthlyWorkingDays = (
  year,
  month,
  weekendDays = [0, 6],
  holidays = []
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month

  return calculateWorkingDays(startDate, endDate, weekendDays, holidays);
};
