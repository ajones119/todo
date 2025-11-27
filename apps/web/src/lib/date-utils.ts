import { format } from 'date-fns';

/**
 * Converts a UTC date string (from database) to a local Date object
 * This preserves the calendar date without timezone offset issues
 * 
 * @param utcDateString - ISO string from database (e.g., "2024-01-15T00:00:00.000Z")
 * @returns Local Date object with the same calendar date
 */
export function utcToLocalDate(utcDateString: string | null | undefined): Date | null {
  if (!utcDateString) return null;
  
  const utcDate = new Date(utcDateString);
  // Extract UTC date components and create a local date
  // This prevents timezone offset from changing the calendar date
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate()
  );
}

/**
 * Formats a UTC date string for display in local timezone
 * 
 * @param utcDateString - ISO string from database
 * @param formatString - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatUtcDate(
  utcDateString: string | null | undefined,
  formatString: string = 'MMM d, yyyy'
): string {
  if (!utcDateString) return '';
  
  const localDate = utcToLocalDate(utcDateString);
  if (!localDate) return '';
  
  return format(localDate, formatString);
}

/**
 * Converts a local Date object to UTC ISO string for database storage
 * Creates a UTC date at midnight for the selected calendar date
 * 
 * @param localDate - Local Date object (e.g., from date picker)
 * @returns ISO string in UTC (e.g., "2024-01-15T00:00:00.000Z")
 */
export function localDateToUtc(localDate: Date | null | undefined): string | null {
  if (!localDate) return null;
  
  // Create UTC date at midnight for the selected calendar date
  return new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0, 0
  )).toISOString();
}

/**
 * Formats a date for display using date-fns
 * Use this for dates that are already in local time
 * 
 * @param date - Date object (already in local time)
 * @param formatString - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatLocalDate(
  date: Date | null | undefined,
  formatString: string = 'MMM d, yyyy'
): string {
  if (!date) return '';
  return format(date, formatString);
}

