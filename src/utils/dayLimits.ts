/**
 * Upper bound for every day number and day offset the user can type.
 *
 * Ten years. Nothing this tool schedules should come close — a treatment plan
 * runs months, not years — but the bound exists to stop a typo or a held-down
 * key from reaching date arithmetic that cannot survive it: Date goes out of
 * range, toISOString throws mid-render, and the calendar the user is holding
 * disappears. Recurrence windows are also walked a day at a time, so an
 * unbounded span hangs the browser before it ever crashes.
 */
export const MAX_DAY_NUMBER = 3650;

/** Clamp a typed 1-based protocol day into range, treating junk as day 1. */
export function clampDayNumber(value: number): number {
    if (!Number.isFinite(value)) return 1;
    return Math.min(MAX_DAY_NUMBER, Math.max(1, Math.trunc(value)));
}

/** Clamp a typed day offset (days before/after something) into range. */
export function clampDayOffset(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(MAX_DAY_NUMBER, Math.max(0, Math.trunc(value)));
}
