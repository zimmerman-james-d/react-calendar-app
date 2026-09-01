import { renderHook } from '@testing-library/react';
import {
  planRebase, dayNumber, dateFromDayNumber, daysBetween, lastScheduledDay, toISODate, MAX_DAY_NUMBER,
} from '../src/utils/rebaseStartDate';
import { useEventGenerator } from '../src/utils/eventUtils';
import { EventDefinition } from '../src/types';

const START = '2026-08-17'; // a Monday

function generate(defs: EventDefinition[], startDate: string) {
  return renderHook(() => useEventGenerator(defs, startDate)).result.current;
}

/** Rebase a schedule and regenerate it, the way the app does. */
function rebaseAndGenerate(defs: EventDefinition[], startDate: string, cutDate: string) {
  const plan = planRebase(defs, startDate, cutDate, generate(defs, startDate));
  return { plan, events: generate(plan.definitions, cutDate) };
}

describe('date helpers', () => {
  it('counts whole days between dates across a month boundary', () => {
    expect(daysBetween('2026-08-17', '2026-09-28')).toBe(42);
  });

  it('numbers the start date as day 1', () => {
    expect(dayNumber(START, START)).toBe(1);
    expect(dayNumber(START, '2026-09-28')).toBe(43);
  });

  it('resolves a day number back to its date', () => {
    expect(dateFromDayNumber(START, 1)).toBe(START);
    expect(dateFromDayNumber(START, 43)).toBe('2026-09-28');
  });

  it('round-trips day numbers and dates across a leap day', () => {
    expect(dateFromDayNumber('2028-02-01', dayNumber('2028-02-01', '2028-03-01'))).toBe('2028-03-01');
  });
});

describe('day-number bounds', () => {
  it('caps at the last scheduled day', () => {
    expect(lastScheduledDay(START, ['2026-09-28', '2026-10-05', '2026-08-20'])).toBe(50);
  });

  it('falls back to a safe bound when there is nothing scheduled', () => {
    expect(lastScheduledDay(START, [])).toBe(MAX_DAY_NUMBER);
    expect(lastScheduledDay('', ['2026-10-05'])).toBe(MAX_DAY_NUMBER);
  });

  it('never reports a day below 1 when everything precedes the start date', () => {
    expect(lastScheduledDay(START, ['2026-01-01'])).toBe(1);
  });

  it('fails soft instead of throwing when a date runs out of range', () => {
    // Date.toISOString throws on an out-of-range value, which would unmount the
    // app mid-render rather than show a validation message.
    expect(() => toISODate(new Date(NaN))).not.toThrow();
    expect(toISODate(new Date(NaN))).toBe('');
    expect(() => dateFromDayNumber(START, 1e12)).not.toThrow();
  });
});

describe('planRebase', () => {
  it('renumbers start-relative offsets so the cut date becomes day 1', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 2 Nelarabine', recurrence: {
          weeklySelections: [[1, 2, 3, 4, 5]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 42, endOffset: 46 } } },
      { id: 'b', title: 'Start Interim Maintenance', relativeTo: { targetId: 'start-date', offset: 85 } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.shiftDays).toBe(42);
    expect(plan.cutDayNumber).toBe(43);
    expect(plan.definitions[0].recurrence!.relativeToStartDate).toEqual({ startOffset: 0, endOffset: 4 });
    expect(plan.definitions[1].relativeTo).toEqual({ targetId: 'start-date', offset: 43 });
    expect(plan.droppedTitles).toEqual([]);
  });

  it('leaves every surviving event on the exact date it already had', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 1', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
      { id: 'b', title: 'Block 2', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 42, endOffset: 48 } } },
      { id: 'c', title: 'Interim', relativeTo: { targetId: 'start-date', offset: 85 } },
    ];

    const before = generate(defs, START);
    const { events: after } = rebaseAndGenerate(defs, START, '2026-09-28');

    const surviving = before.filter(e => (e.date as string) >= '2026-09-28').map(e => e.date).sort();
    expect(after.map(e => e.date).sort()).toEqual(surviving);
  });

  it('soft-deletes definitions that fall entirely before the cut date', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 1', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
      { id: 'b', title: 'Block 2', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 42, endOffset: 48 } } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.droppedTitles).toEqual(['Block 1']);
    expect(plan.definitions[0].deleted).toBe(true);
    expect(plan.definitions[1].deleted).toBeUndefined();
  });

  it('drops a start-relative single event whose day is now before day 1', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Check Counts', relativeTo: { targetId: 'start-date', offset: 36 } },
      { id: 'b', title: 'Later Check', relativeTo: { targetId: 'start-date', offset: 85 } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.droppedTitles).toEqual(['Check Counts']);
    expect(plan.definitions[1].relativeTo!.offset).toBe(43);
  });

  it('splits a recurring window that straddles the cut', () => {
    // Mondays across a window that starts before the cut and ends after it.
    const defs: EventDefinition[] = [
      { id: 'a', groupId: 'g', title: 'Mercaptopurine', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 27 } } },
    ];

    const { plan, events } = rebaseAndGenerate(defs, START, '2026-08-31');

    expect(plan.droppedTitles).toEqual([]);
    expect(plan.splits).toEqual([{ id: 'a', title: 'Mercaptopurine', dropped: 2, kept: 2 }]);
    expect(plan.definitions).toHaveLength(2);

    const [past, live] = plan.definitions;
    expect(past.deleted).toBe(true);
    // Must not look like one of the live half's instance ids ("a-<date>").
    expect(past.id.startsWith('a-')).toBe(false);
    expect(past.recurrence!.relativeToStartDate).toBeUndefined();
    expect(past.recurrence!.startRecur).toBe('2026-08-17');
    expect(past.recurrence!.endRecur).toBe('2026-08-30');

    expect(live.id).toBe('a');
    expect(live.groupId).toBe('g');
    expect(live.deleted).toBeUndefined();
    expect(live.recurrence!.relativeToStartDate).toEqual({ startOffset: 0, endOffset: 13 });

    expect(events.map(e => e.date)).toEqual(['2026-08-31', '2026-09-07']);
  });

  it('does not announce or freeze a split when no dates fall before the cut', () => {
    // A Tuesdays-only window spanning Sun 2026-09-27 to Mon 2026-09-28 holds no
    // Tuesday at all, so cutting it drops nothing.
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Check Counts Locally', recurrence: {
          weeklySelections: [[2]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 41, endOffset: 42 } } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.splits).toEqual([]);
    expect(plan.droppedTitles).toEqual([]);
    expect(plan.definitions).toHaveLength(1);
    expect(plan.definitions[0].deleted).toBeUndefined();
  });

  it('keeps a split multi-week cycle firing on the same dates', () => {
    // A 3-week cycle firing on the Monday of week 2 only. The live half opens
    // on the cut date, so its pattern has to rotate to stay in phase.
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Every third Monday', recurrence: {
          weeklySelections: [[], [1], []], recurrenceCycle: 3,
          relativeToStartDate: { startOffset: 0, endOffset: 90 } } },
    ];

    const before = generate(defs, START).map(e => e.date);
    const { events } = rebaseAndGenerate(defs, START, '2026-09-07');

    expect(events.map(e => e.date)).toEqual(before.filter(d => (d as string) >= '2026-09-07'));
  });

  it('restores a split series past half to the dates it actually ran on', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Mercaptopurine', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 27 } } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-08-31');
    const restored = plan.definitions.map(d => ({ ...d, deleted: false }));

    // The frozen half stays put even after the delay is applied.
    const delayed = generate(restored, '2026-09-07');
    expect(delayed.filter(e => (e.date as string) < '2026-08-31').map(e => e.date))
      .toEqual(['2026-08-17', '2026-08-24']);
  });

  it('keeps a straddling multi-week cycle in phase', () => {
    // A 3-week cycle firing on the Monday of week 1 only. Clamping the window
    // start to day 1 would re-anchor the cycle and fire on the wrong weeks.
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Every third Monday', recurrence: {
          weeklySelections: [[1], [], []], recurrenceCycle: 3,
          relativeToStartDate: { startOffset: 0, endOffset: 63 } } },
    ];

    const before = generate(defs, START).map(e => e.date);
    expect(before).toEqual(['2026-08-17', '2026-09-07', '2026-09-28', '2026-10-19']);

    const { events } = rebaseAndGenerate(defs, START, '2026-09-07');
    expect(events.map(e => e.date)).toEqual(['2026-09-07', '2026-09-28', '2026-10-19']);
  });

  it('reports surviving fixed-date events as pinned and leaves their dates alone', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'School re-entry', date: '2026-10-05' },
      { id: 'b', title: 'Past appointment', date: '2026-08-20' },
      { id: 'c', title: 'Fixed clinic run', recurrence: {
          startRecur: '2026-09-28', endRecur: '2026-10-12', weeklySelections: [[2]], recurrenceCycle: 1 } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.droppedTitles).toEqual(['Past appointment']);
    expect(plan.pinned.map(p => p.title)).toEqual(['School re-entry', 'Fixed clinic run']);
    expect(plan.pinned[0].dates).toEqual(['2026-10-05']);
    expect(plan.definitions[0].date).toBe('2026-10-05');
  });

  it('does not report start-relative events as pinned', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Vincristine', relativeTo: { targetId: 'start-date', offset: 50 } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.pinned).toEqual([]);
  });

  it('keeps an event written relative to a surviving recurrence instance working', () => {
    // The target id embeds a literal date, so it only keeps resolving because
    // a rebase moves nothing on the calendar.
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Nelarabine', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 42, endOffset: 46 } } },
      { id: 'b', title: 'Counts before Nelarabine',
        relativeTo: { targetId: 'a-2026-09-28', offset: -1 } },
    ];

    const { plan, events } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.droppedTitles).toEqual([]);
    expect(events.find(e => e.id === 'b')?.date).toBe('2026-09-27');
  });

  it('drops a dependent whose target instance is entirely in the dropped past', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 1', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
      { id: 'b', title: 'Counts before Block 1',
        relativeTo: { targetId: 'a-2026-08-17', offset: -1 } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.droppedTitles.sort()).toEqual(['Block 1', 'Counts before Block 1']);
  });

  it('carries group-relative events along with their surviving target', () => {
    const defs: EventDefinition[] = [
      { id: 'a', groupId: 'g1', title: 'Day Hospital', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 42, endOffset: 48 } } },
      { id: 'b', groupId: 'g2', title: 'NO VORICONAZOLE', relativeRecurrence: {
          targetGroupId: 'g1', targetType: 'group',
          dayOf: true, daysBefore: true, daysAfter: true, beforeOffset: 1, afterOffset: 1 } },
    ];

    const { plan, events } = rebaseAndGenerate(defs, START, '2026-09-28');

    expect(plan.droppedTitles).toEqual([]);
    expect(events.filter(e => e.title === 'NO VORICONAZOLE').map(e => e.date).sort())
      .toEqual(['2026-09-27', '2026-09-28', '2026-09-29']);
  });

  it('freezes already-deleted definitions to their real dates without re-reporting them', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Held drug', deleted: true, relativeTo: { targetId: 'start-date', offset: 50 } },
      { id: 'b', title: 'Active drug', relativeTo: { targetId: 'start-date', offset: 50 } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    // 2026-08-17 + 50 days. Frozen, so a later start-date change cannot move it.
    expect(plan.definitions[0].date).toBe('2026-10-06');
    expect(plan.definitions[0].relativeTo).toBeUndefined();
    expect(plan.definitions[0].deleted).toBe(true);
    expect(plan.droppedTitles).toEqual([]);
  });

  it('freezes dropped events to the dates they fell on, so a later delay cannot move them', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 1', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
      { id: 'b', title: 'Counts (day 37)', relativeTo: { targetId: 'start-date', offset: 36 } },
      { id: 'c', title: 'Block 2', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 42, endOffset: 48 } } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    const block1 = plan.definitions.find(d => d.title === 'Block 1')!;
    expect(block1.deleted).toBe(true);
    expect(block1.recurrence!.relativeToStartDate).toBeUndefined();
    expect(block1.recurrence!.startRecur).toBe('2026-08-17');
    expect(block1.recurrence!.endRecur).toBe('2026-08-23');

    const counts = plan.definitions.find(d => d.title === 'Counts (day 37)')!;
    expect(counts.deleted).toBe(true);
    expect(counts.date).toBe('2026-09-22');
    expect(counts.relativeTo).toBeUndefined();
  });

  it('leaves nothing in the deleted list measured against day 1', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 1', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
      { id: 'b', title: 'Straddler', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 60 } } },
      { id: 'c', title: 'Counts', relativeTo: { targetId: 'start-date', offset: 10 } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');

    for (const def of plan.definitions.filter(d => d.deleted)) {
      expect(def.recurrence?.relativeToStartDate).toBeUndefined();
      expect(def.relativeTo?.targetId).not.toBe('start-date');
    }
  });

  it('survives a second rebase after the dropped half is restored', () => {
    const defs: EventDefinition[] = [
      { id: 'a', groupId: 'g', title: 'Mercaptopurine', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 41 } } },
    ];

    const first = rebaseAndGenerate(defs, START, '2026-08-31').plan;
    const restored = first.definitions.map(d => ({ ...d, deleted: false }));

    // The live half still runs to day 28; cutting again must not confuse the
    // restored past half for one of its instances.
    const second = planRebase(restored, '2026-08-31', '2026-09-14', generate(restored, '2026-08-31'));
    const live = second.definitions.find(d => d.id === 'a')!;

    expect(live.deleted).toBeFalsy();
    expect(live.recurrence!.relativeToStartDate).toEqual({ startOffset: 0, endOffset: 13 });

    const restoredPast = second.definitions.find(d => d.id === 'dropped-a')!;
    expect(restoredPast.deleted).toBe(true);
    expect(restoredPast.recurrence!.startRecur).toBe('2026-08-17');
  });

  it('is a no-op when the cut date is the current start date', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 1', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, START);

    expect(plan.shiftDays).toBe(0);
    expect(plan.droppedTitles).toEqual([]);
    expect(plan.definitions[0].recurrence!.relativeToStartDate).toEqual({ startOffset: 0, endOffset: 6 });
  });

  it('shifts the rebased schedule by the delay when the start date is moved afterwards', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Block 1', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
      { id: 'b', title: 'Block 2', recurrence: {
          weeklySelections: [[1]], recurrenceCycle: 1,
          relativeToStartDate: { startOffset: 42, endOffset: 48 } } },
    ];

    const { plan } = rebaseAndGenerate(defs, START, '2026-09-28');
    // The nurse then pushes the resumed schedule out by a one-week delay.
    const delayed = generate(plan.definitions, '2026-10-05');

    expect(delayed.map(e => e.date)).toEqual(['2026-10-05']);
  });
});
