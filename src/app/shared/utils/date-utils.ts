/**
 * Safely parses any date or datetime string (e.g. "2026-08-04 10:15:00", "2026-08-04T10:15:00.000Z", "2026-08-04")
 * into a Date object representing the exact local components (Year, Month, Day, Hour, Minute, Second)
 * without any UTC or timezone shift (IST +05:30).
 */
export function parseLocalDatetime(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  let str = String(val).trim();
  if (!str) return null;

  try {
    // If string is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    // Replace T with space and remove Z or milliseconds indicator
    let clean = str.replace('T', ' ').replace('Z', '').split('.')[0];
    if (clean.includes(' ')) {
      const [datePart, timePart] = clean.split(' ');
      if (datePart && datePart.includes('-')) {
        const [y, m, d] = datePart.split('-').map(Number);
        const timeTokens = (timePart || '00:00:00').split(':').map(Number);
        const hh = timeTokens[0] || 0;
        const mm = timeTokens[1] || 0;
        const ss = timeTokens[2] || 0;
        return new Date(y, m - 1, d, hh, mm, ss);
      }
    }

    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
  } catch {
    return null;
  }
}

/**
 * Formats a date/datetime into "10:15 AM" or "07:21 PM" in local time.
 */
export function formatLocalTime(val: any): string {
  if (!val) return '-';
  const d = parseLocalDatetime(val);
  if (!d) return '-';

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Formats a date/datetime into "2026-08-04" in local time.
 */
export function formatLocalDate(val: any): string {
  if (!val) return '-';
  const d = parseLocalDatetime(val);
  if (!d) return '-';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
