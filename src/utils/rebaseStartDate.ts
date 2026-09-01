import { EventInput } from '@fullcalendar/core';
import { EventDefinition } from '../types';
import { MAX_DAY_NUMBER } from './dayLimits';

export { MAX_DAY_NUMBER };

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function parseISODate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

/** The last day the schedule reaches, which is as far as a new day 1 can move. */
export function lastScheduledDay(startDate: string, eventDates: string[]): number {
    const last = eventDates.filter(Boolean).sort().pop();
    if (!startDate || !last) return MAX_DAY_NUMBER;
    return Math.min(MAX_DAY_NUMBER, Math.max(1, dayNumber(startDate, last)));
}

// Fails soft rather than throwing: a bad date here would unmount the app and
// lose the calendar the user is holding. Callers validate before relying on it.
export function toISODate(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

export function addDays(iso: string, days: number): string {
    const date = parseISODate(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return toISODate(date);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
    return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / MS_PER_DAY);
}

/** 1-based day number of `date` within a schedule whose day 1 is `startDate`. */
export function dayNumber(startDate: string, date: string): number {
    return daysBetween(startDate, date) + 1;
}

/** The date holding 1-based `day` in a schedule whose day 1 is `startDate`. */
export function dateFromDayNumber(startDate: string, day: number): string {
    return addDays(startDate, day - 1);
}

/**
 * Which week of a recurrence cycle a date falls in is measured from the Sunday
 * of the week its window opens in (see generateRecurringWeeklyEvents). Moving a
 * window's start therefore re-anchors the cycle, and the same calendar dates
 * start matching different weeks of the pattern.
 *
 * Rotating the weekly selections by the number of weeks the anchor moved undoes
 * that exactly: a date that used to match week `w` now sits at week `w - k`, so
 * the selections for week `w` have to move to index `w - k`.
 */
export function rotateForNewWindowStart(
    weeklySelections: number[][],
    recurrenceCycle: number,
    oldWindowStart: string,
    newWindowStart: string
): number[][] {
    if (recurrenceCycle <= 1) return weeklySelections;

    const sundayOf = (iso: string) => addDays(iso, -parseISODate(iso).getUTCDay());
    const weeksMoved = daysBetween(sundayOf(oldWindowStart), sundayOf(newWindowStart)) / 7;
    const k = ((Math.round(weeksMoved) % recurrenceCycle) + recurrenceCycle) % recurrenceCycle;
    if (k === 0) return weeklySelections;

    return weeklySelections.map((_, j) => weeklySelections[(j + k) % recurrenceCycle]);
}

/**
 * A definition whose dates are written in absolute terms. Rebasing renumbers the
 * schedule around a new day 1 but never moves these, so they are surfaced to the
 * user as needing a manual look.
 */
export interface PinnedDefinitionSummary {
    id: string;
    title: string;
    dates: string[];
}

export interface SplitSummary {
    id: string;
    title: string;
    dropped: number;
    kept: number;
}

export interface RebasePlan {
    /** Days from the old start date to the new one. */
    shiftDays: number;
    /** The day number the cut date currently holds in the schedule. */
    cutDayNumber: number;
    definitions: EventDefinition[];
    /** Titles dropped in full. */
    droppedTitles: string[];
    /** Series running across the cut, with how many of their dates go and stay. */
    splits: SplitSummary[];
    pinned: PinnedDefinitionSummary[];
}

/** Instance ids are the definition id, optionally with a suffix. */
function instanceDatesFor(def: EventDefinition, generatedEvents: EventInput[]): string[] {
    return generatedEvents
        .filter(e => {
            const id = e.id?.toString();
            return id === def.id || (id !== undefined && id.startsWith(def.id + '-'));
        })
        .map(e => e.date?.toString())
        .filter((d): d is string => Boolean(d));
}

function isPinnedToRealDates(def: EventDefinition): boolean {
    if (def.date) return true;
    return Boolean(def.recurrence && !def.recurrence.relativeToStartDate);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The instance date a definition is pinned to, when it targets one. */
function targetInstanceDate(def: EventDefinition, definitions: EventDefinition[]): string | undefined {
    const targetId = def.relativeTo?.targetId;
    if (!targetId || targetId === 'start-date') return undefined;
    const owner = definitions.find(d => targetId.startsWith(d.id + '-'));
    if (!owner) return undefined;
    const date = targetId.slice(owner.id.length + 1);
    return ISO_DATE.test(date) ? date : undefined;
}

/** The definition an event is written relative to, if it is written relative to one. */
function anchorOf(def: EventDefinition, definitions: EventDefinition[]): EventDefinition | undefined {
    const targetId = def.relativeTo?.targetId ?? def.relativeRecurrence?.targetId;
    if (targetId && targetId !== 'start-date') {
        return definitions.find(d => targetId === d.id || targetId.startsWith(d.id + '-'));
    }
    const targetGroupId = def.relativeRecurrence?.targetGroupId;
    if (targetGroupId) return definitions.find(d => d.groupId === targetGroupId);
    return undefined;
}

/**
 * Renumber a schedule so `cutDate` becomes day 1, dropping what came before it.
 *
 * Nothing moves on the calendar: every surviving event keeps the exact date it
 * already had. To then push the remaining schedule out by a treatment delay,
 * change the start date as usual once the rebase is applied.
 *
 * What is dropped becomes history, so it is frozen to the real dates it
 * occupied and soft-deleted rather than left measured against a day 1 it is no
 * longer part of. Freezing it keeps a later start-date change from dragging the
 * past forward with the delay, and lets it be restored to exactly where it was.
 * A recurring series running across the cut is split into a frozen past half and
 * a live half starting at the new day 1.
 */
export function planRebase(
    eventDefinitions: EventDefinition[],
    oldStartDate: string,
    cutDate: string,
    generatedEvents: EventInput[]
): RebasePlan {
    const shiftDays = daysBetween(oldStartDate, cutDate);
    const lastDroppedDate = addDays(cutDate, -1);

    const dropped = decideDrops(eventDefinitions, cutDate, generatedEvents, shiftDays);
    const droppedTitles: string[] = [];
    const splits: SplitSummary[] = [];
    const pinned: PinnedDefinitionSummary[] = [];
    const definitions: EventDefinition[] = [];

    for (const def of eventDefinitions) {
        // Anything already deleted is frozen too, so the invariant holds that
        // nothing in the deleted list is measured against day 1 and nothing
        // there moves when the start date changes.
        if (def.deleted) {
            definitions.push(freeze(def, oldStartDate, generatedEvents));
            continue;
        }

        if (dropped.has(def.id)) {
            droppedTitles.push(def.title);
            definitions.push(freeze(def, oldStartDate, generatedEvents));
            continue;
        }

        const window = startRelativeWindow(def, oldStartDate);
        if (window && window.start < cutDate && window.end >= cutDate) {
            const dates = instanceDatesFor(def, generatedEvents);
            const before = dates.filter(d => d < cutDate).length;

            // A window can open before the cut yet land no dates there. There
            // is nothing to drop, so no frozen half is made and the user is not
            // told about a split that changes nothing for them.
            if (before > 0) {
                splits.push({ id: def.id, title: def.title, dropped: before, kept: dates.length - before });
            }
            definitions.push(...splitAtCut(def, window, cutDate, lastDroppedDate, shiftDays, before > 0));
            continue;
        }

        definitions.push(renumber(def, shiftDays));

        if (isPinnedToRealDates(def)) {
            pinned.push({
                id: def.id,
                title: def.title,
                dates: instanceDatesFor(def, generatedEvents).filter(d => d >= cutDate).sort(),
            });
        }
    }

    return {
        shiftDays,
        cutDayNumber: dayNumber(oldStartDate, cutDate),
        definitions,
        droppedTitles,
        splits,
        pinned,
    };
}

/** The real dates a start-date-relative recurrence window covers. */
function startRelativeWindow(def: EventDefinition, oldStartDate: string) {
    const relative = def.recurrence?.relativeToStartDate;
    if (!relative) return undefined;
    return {
        start: addDays(oldStartDate, relative.startOffset),
        end: addDays(oldStartDate, relative.endOffset),
    };
}

/** Move a surviving definition's start-date-relative offsets onto the new day 1. */
function renumber(def: EventDefinition, shiftDays: number): EventDefinition {
    if (def.recurrence?.relativeToStartDate) {
        const { startOffset, endOffset } = def.recurrence.relativeToStartDate;
        return {
            ...def,
            recurrence: {
                ...def.recurrence,
                relativeToStartDate: {
                    startOffset: startOffset - shiftDays,
                    endOffset: endOffset - shiftDays,
                },
            },
        };
    }
    if (def.relativeTo?.targetId === 'start-date') {
        return { ...def, relativeTo: { ...def.relativeTo, offset: def.relativeTo.offset - shiftDays } };
    }
    return def;
}

/**
 * Pin a dropped definition to the real dates it occupied and soft-delete it, so
 * it reads correctly in the deleted list, restores to where it actually was, and
 * does not move when the start date changes later.
 */
function freeze(
    def: EventDefinition,
    oldStartDate: string,
    generatedEvents: EventInput[]
): EventDefinition {
    const relative = def.recurrence?.relativeToStartDate;
    if (relative) {
        const { relativeToStartDate, ...rest } = def.recurrence!;
        return {
            ...def,
            deleted: true,
            recurrence: {
                ...rest,
                startRecur: addDays(oldStartDate, relative.startOffset),
                endRecur: addDays(oldStartDate, relative.endOffset),
            },
        };
    }

    if (def.relativeTo) {
        // Single events resolve to one date, so freezing them is exact. A
        // definition already deleted generates nothing, so anything anchored to
        // the start date is resolved by arithmetic rather than looked up.
        const date = def.relativeTo.targetId === 'start-date'
            ? addDays(oldStartDate, def.relativeTo.offset)
            : instanceDatesFor(def, generatedEvents)[0];
        if (date) {
            const { relativeTo, ...rest } = def;
            return { ...rest, deleted: true, date };
        }
    }

    // A series written relative to another series has no single date to freeze
    // to. It keeps following its target, which is itself frozen if it was dropped.
    return { ...def, deleted: true };
}

/**
 * Break a series running across the cut into a frozen past half and a live half
 * that starts at the new day 1.
 *
 * The live half keeps the original definition and group ids so events written
 * relative to one of its instances, or to its group, keep resolving. Its weekly
 * pattern is rotated because its window now opens on the cut date rather than
 * where the series began.
 */
function splitAtCut(
    def: EventDefinition,
    window: { start: string; end: string },
    cutDate: string,
    lastDroppedDate: string,
    shiftDays: number,
    keepPastHalf: boolean
): EventDefinition[] {
    const recurrence = def.recurrence!;
    const { relativeToStartDate, ...withoutOffsets } = recurrence;

    const past: EventDefinition = {
        ...def,
        // Prefixed, not suffixed: an id of `<original>-...` would look like one
        // of the live half's generated instance ids to the lookups above.
        id: `dropped-${def.id}`,
        groupId: def.groupId ? `dropped-${def.groupId}` : undefined,
        deleted: true,
        recurrence: { ...withoutOffsets, startRecur: window.start, endRecur: lastDroppedDate },
    };

    const live: EventDefinition = {
        ...def,
        recurrence: {
            ...recurrence,
            weeklySelections: rotateForNewWindowStart(
                recurrence.weeklySelections,
                recurrence.recurrenceCycle,
                window.start,
                cutDate
            ),
            relativeToStartDate: {
                startOffset: 0,
                endOffset: relativeToStartDate!.endOffset - shiftDays,
            },
        },
    };

    return keepPastHalf ? [past, live] : [live];
}

function decideDrops(
    definitions: EventDefinition[],
    cutDate: string,
    generatedEvents: EventInput[],
    shiftDays: number
): Set<string> {
    const dropped = new Set<string>();

    definitions.forEach(def => {
        if (def.deleted) return;
        if (anchorOf(def, definitions)) return;
        if (isSelfAnchoredDrop(def, cutDate, generatedEvents, shiftDays)) dropped.add(def.id);
    });

    // Definitions written relative to another event follow it, however far
    // before the new day 1 their own date sits: a lab draw written as "the day
    // before" the first treatment of the resumed block belongs to that block,
    // not to the dropped past. One written against an instance that is itself
    // in the dropped past goes with it. Repeat until the chain settles.
    let changed = true;
    while (changed) {
        changed = false;
        definitions.forEach(def => {
            if (def.deleted || dropped.has(def.id)) return;

            const instanceDate = targetInstanceDate(def, definitions);
            if (instanceDate && instanceDate < cutDate) {
                dropped.add(def.id);
                changed = true;
                return;
            }

            const anchor = anchorOf(def, definitions);
            if (anchor && dropped.has(anchor.id)) {
                dropped.add(def.id);
                changed = true;
            }
        });
    }

    return dropped;
}

function isSelfAnchoredDrop(
    def: EventDefinition,
    cutDate: string,
    generatedEvents: EventInput[],
    shiftDays: number
): boolean {
    // A window measured from the start date is dropped only when all of it
    // lands before the new day 1; one that straddles the cut is split instead.
    if (def.recurrence?.relativeToStartDate) {
        return def.recurrence.relativeToStartDate.endOffset < shiftDays;
    }
    if (def.relativeTo?.targetId === 'start-date') {
        return def.relativeTo.offset < shiftDays;
    }

    // Everything else is judged on the dates it actually produced. A definition
    // that produced nothing is left alone rather than dropped.
    const dates = instanceDatesFor(def, generatedEvents);
    if (dates.length === 0) return false;
    return dates.every(date => date < cutDate);
}
