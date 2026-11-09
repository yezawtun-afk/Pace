/**
 * Best-effort detection of the device time zone, e.g. "Europe/Berlin".
 * Hermes ships Intl, but be defensive: an invalid value would break the
 * profile row, and "UTC" is always a safe fallback.
 */
export function detectTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === 'string' && zone.length > 0 ? zone : 'UTC';
  } catch {
    return 'UTC';
  }
}

/** "20:30:00" -> "20:30" (Postgres `time` columns include seconds). */
export function shortTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.slice(0, 5);
}

/** "20:30" -> "20:30:00" so Postgres accepts it without a cast. */
export function toDbTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

/** Friendly label for a time zone, e.g. "Europe/Berlin (GMT+1)". */
export function timeZoneLabel(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value;
    return offset ? `${zone} (${offset})` : zone;
  } catch {
    return zone;
  }
}
