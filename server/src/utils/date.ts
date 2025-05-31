/**
 * Get ISO week number for a date
 * ISO 8601 week date system:
 * - Weeks start on Monday
 * - First week of the year is the week containing the first Thursday of the year
 * - Week numbers range from 1 to 53
 */
export function getWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getUTCDay() + 6) % 7; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  target.setUTCDate(target.getUTCDate() - dayNumber + 3); // Target Thursday
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1); // Set to January 1st
  if (target.getUTCDay() !== 4) { // If not Thursday
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7); // Set to first Thursday
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000); // 604800000 = 7 * 24 * 60 * 60 * 1000
}

/**
 * Get the start and end dates of a week in a given year and week number
 * Returns dates in UTC
 */
export function getWeekDates(year: number, weekNumber: number): { start: Date; end: Date } {
  const simple = new Date(Date.UTC(year, 0, 1 + (weekNumber - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setUTCDate(ISOweekStart.getUTCDate() + 4); // End on Friday
  
  return {
    start: ISOweekStart,
    end: ISOweekEnd
  };
} 