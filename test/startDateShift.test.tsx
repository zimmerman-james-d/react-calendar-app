import { renderHook } from '@testing-library/react';
import { remapInstanceReferences } from '../src/utils/startDateShift';
import { useEventGenerator } from '../src/utils/eventUtils';
import { EventDefinition } from '../src/types';

const START = '2026-08-17';
const generate = (defs: EventDefinition[], s: string) =>
  renderHook(() => useEventGenerator(defs, s)).result.current;

const startRelativeSeries: EventDefinition = {
  id: 'series', groupId: 'g', title: 'Nelarabine',
  recurrence: { weeklySelections: [[1]], recurrenceCycle: 1,
                relativeToStartDate: { startOffset: 0, endOffset: 6 } },
};

describe('remapInstanceReferences', () => {
  it('keeps an instance-relative event alive when the start date moves', () => {
    const defs: EventDefinition[] = [
      startRelativeSeries,
      { id: 'lab', title: 'Check Counts', relativeTo: { targetId: 'series-2026-08-17', offset: -1 } },
    ];

    // Without the remap the dependent silently disappears.
    expect(generate(defs, '2026-08-24').find(e => e.id === 'lab')).toBeUndefined();

    const remapped = remapInstanceReferences(defs, START, '2026-08-24');
    expect(remapped[1].relativeTo!.targetId).toBe('series-2026-08-24');
    expect(generate(remapped, '2026-08-24').find(e => e.id === 'lab')?.date).toBe('2026-08-23');
  });

  it('leaves references into a fixed-date series alone', () => {
    const defs: EventDefinition[] = [
      { id: 'fixed', groupId: 'g', title: 'Fixed clinic',
        recurrence: { startRecur: '2026-08-17', endRecur: '2026-08-31',
                      weeklySelections: [[1]], recurrenceCycle: 1 } },
      { id: 'lab', title: 'Check Counts', relativeTo: { targetId: 'fixed-2026-08-17', offset: -1 } },
    ];

    expect(remapInstanceReferences(defs, START, '2026-08-24')).toEqual(defs);
  });

  it('leaves start-date references and plain definition references alone', () => {
    const defs: EventDefinition[] = [
      { id: 'a', title: 'Anchor', date: '2026-09-01' },
      { id: 'b', title: 'From start', relativeTo: { targetId: 'start-date', offset: 10 } },
      { id: 'c', title: 'From single event', relativeTo: { targetId: 'a', offset: 2 } },
    ];

    expect(remapInstanceReferences(defs, START, '2026-08-24')).toEqual(defs);
  });

  it('is a no-op when the date does not change or is not set', () => {
    const defs: EventDefinition[] = [
      startRelativeSeries,
      { id: 'lab', title: 'Check Counts', relativeTo: { targetId: 'series-2026-08-17', offset: -1 } },
    ];

    expect(remapInstanceReferences(defs, START, START)).toBe(defs);
    expect(remapInstanceReferences(defs, '', '2026-08-24')).toBe(defs);
    expect(remapInstanceReferences(defs, START, '')).toBe(defs);
  });

  it('handles a backwards start-date move', () => {
    const defs: EventDefinition[] = [
      startRelativeSeries,
      { id: 'lab', title: 'Check Counts', relativeTo: { targetId: 'series-2026-08-17', offset: -1 } },
    ];

    expect(remapInstanceReferences(defs, START, '2026-08-10')[1].relativeTo!.targetId)
      .toBe('series-2026-08-10');
  });
});
