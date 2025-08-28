import { generateRecurringWeeklyEvents, generateRecurringRelativeDate } from '../src/utils/eventUtils';
import { renderHook } from '@testing-library/react';
import { useEventGenerator } from '../src/utils/eventUtils';
import { EventDefinition } from '../src/types';

describe('generateRecurringWeeklyEvents', () => {
  it('should generate a simple weekly schedule correctly', () => {
    const events = generateRecurringWeeklyEvents('Weekly Meeting', '2025-08-17', '2025-08-31', [[2, 4]], 1);
    const expectedDates = ['2025-08-19', '2025-08-21', '2025-08-26', '2025-08-28'];
    expect(events.map(e => e.date)).toEqual(expectedDates);
  });

  it('should generate a 2-week schedule correctly', () => {
    const events = generateRecurringWeeklyEvents('Bi-weekly', '2025-08-17', '2025-08-31', [[1], [3]], 2);
    const expectedDates = ['2025-08-18', '2025-08-27'];
    expect(events.map(e => e.date)).toEqual(expectedDates);
  });

  it('should generate a 3-week schedule correctly', () => {
    const events = generateRecurringWeeklyEvents('3-Week Cycle', '2025-08-17', '2025-09-13', [[1], [3], [5]], 3);
    const expectedDates = ['2025-08-18', '2025-08-27', '2025-09-05', '2025-09-08'];
    expect(events.map(e => e.date)).toEqual(expectedDates);
  });
  
  it('should correctly handle a leap year in a 4-week cycle', () => {
    const events = generateRecurringWeeklyEvents('Leap Year', '2024-02-18', '2024-03-16', [[0], [], [4], []], 4);
    const expectedDates = ['2024-02-18', '2024-03-07'];
    expect(events.map(e => e.date)).toEqual(expectedDates);
  });
});

describe('generateRecurringRelativeDate', () => {
    it('should correctly add a positive offset to a date', () => {
        const baseDate = new Date(Date.UTC(2025, 9, 15)); // Oct 15, 2025
        const newDate = generateRecurringRelativeDate(baseDate, 5);
        expect(newDate.toISOString().split('T')[0]).toBe('2025-10-20');
    });

    it('should correctly apply a negative offset to a date', () => {
        const baseDate = new Date(Date.UTC(2025, 9, 15));
        const newDate = generateRecurringRelativeDate(baseDate, -3);
        expect(newDate.toISOString().split('T')[0]).toBe('2025-10-12');
    });

    it('should return the same date for a zero offset', () => {
        const baseDate = new Date(Date.UTC(2025, 9, 15));
        const newDate = generateRecurringRelativeDate(baseDate, 0);
        expect(newDate.toISOString().split('T')[0]).toBe('2025-10-15');
    });
});

describe('useEventGenerator Hook', () => {
  it('should return an empty array with no definitions', () => {
    const { result } = renderHook(() => useEventGenerator([], ''));
    expect(result.current).toEqual([]);
  });

  it('should generate a single, specific date event', () => {
    const definitions: EventDefinition[] = [
      { id: '1', title: 'Test Event', date: '2025-10-20' }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    expect(result.current).toEqual([
      { id: '1', title: 'Test Event', date: '2025-10-20' }
    ]);
  });

  it('should generate a standard weekly recurring event', () => {
    const definitions: EventDefinition[] = [
      {
        id: 'def-1',
        groupId: 'group-1',
        title: 'Weekly Standup',
        recurrence: {
          startRecur: '2025-10-06',
          endRecur: '2025-10-20',
          weeklySelections: [[1]], // Mondays
          recurrenceCycle: 1,
        }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    expect(result.current.length).toBe(3);
    expect(result.current.map(e => e.date)).toEqual(['2025-10-06', '2025-10-13', '2025-10-20']);
  });

  it('should generate an event relative to the start date', () => {
    const definitions: EventDefinition[] = [
      {
        id: '2',
        title: 'Follow-up',
        relativeTo: { targetId: 'start-date', offset: 5 }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, '2025-10-01'));
    expect(result.current[0].date).toBe('2025-10-06');
  });

  it('should generate an event relative to another event', () => {
    const definitions: EventDefinition[] = [
      { id: '1', title: 'Base Event', date: '2025-11-10' },
      {
        id: '2',
        title: 'Relative Event',
        relativeTo: { targetId: '1', offset: -3 }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    expect(result.current.find(e => e.id === '2')?.date).toBe('2025-11-07');
  });

  it('should generate a recurring series relative to another (days after)', () => {
    const definitions: EventDefinition[] = [
      {
        id: 'def-1', groupId: 'group-1', title: 'Base Series',
        recurrence: { startRecur: '2025-11-03', endRecur: '2025-11-17', weeklySelections: [[1]], recurrenceCycle: 1 }
      },
      {
        id: 'def-2', groupId: 'group-2', title: 'Relative Series',
        relativeRecurrence: { targetGroupId: 'group-1', targetType: 'group', daysAfter: true, afterOffset: 2, daysBefore: false, beforeOffset: 1, dayOf: false }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    const relativeEvents = result.current.filter(e => e.title === 'Relative Series');
    expect(relativeEvents.length).toBe(3);
    expect(relativeEvents.map(e => e.date)).toEqual(['2025-11-05', '2025-11-12', '2025-11-19']);
  });

  it('should generate a recurring series relative to another (days before)', () => {
    const definitions: EventDefinition[] = [
      {
        id: 'def-1', groupId: 'group-1', title: 'Base Series',
        recurrence: { startRecur: '2025-11-03', endRecur: '2025-11-17', weeklySelections: [[1]], recurrenceCycle: 1 }
      },
      {
        id: 'def-2', groupId: 'group-2', title: 'Relative Series',
        relativeRecurrence: { targetGroupId: 'group-1', targetType: 'group', daysBefore: true, beforeOffset: 3, daysAfter: false, afterOffset: 1, dayOf: false }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    const relativeEvents = result.current.filter(e => e.title === 'Relative Series');
    expect(relativeEvents.length).toBe(3);
    expect(relativeEvents.map(e => e.date)).toEqual(['2025-10-31', '2025-11-07', '2025-11-14']);
  });

  it('should generate a recurring series relative to another (day of)', () => {
    const definitions: EventDefinition[] = [
      {
        id: 'def-1', groupId: 'group-1', title: 'Base Series',
        recurrence: { startRecur: '2025-11-03', endRecur: '2025-11-17', weeklySelections: [[1]], recurrenceCycle: 1 }
      },
      {
        id: 'def-2', groupId: 'group-2', title: 'Relative Series',
        relativeRecurrence: { targetGroupId: 'group-1', targetType: 'group', dayOf: true, daysBefore: false, beforeOffset: 1, daysAfter: false, afterOffset: 1 }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    const relativeEvents = result.current.filter(e => e.title === 'Relative Series');
    expect(relativeEvents.length).toBe(3);
    expect(relativeEvents.map(e => e.date)).toEqual(['2025-11-03', '2025-11-10', '2025-11-17']);
  });

  it('should generate a recurring series with all three relative options enabled', () => {
    const definitions: EventDefinition[] = [
      {
        id: 'def-1', groupId: 'group-1', title: 'Base Series',
        recurrence: { startRecur: '2025-11-10', endRecur: '2025-11-10', weeklySelections: [[1]], recurrenceCycle: 1 }
      },
      {
        id: 'def-2', groupId: 'group-2', title: 'Relative Series',
        relativeRecurrence: { targetGroupId: 'group-1', targetType: 'group', dayOf: true, daysBefore: true, beforeOffset: 2, daysAfter: true, afterOffset: 3 }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    const relativeEvents = result.current.filter(e => e.title === 'Relative Series');
    expect(relativeEvents.length).toBe(3);
    const dates = relativeEvents.map(e => e.date).sort();
    expect(dates).toEqual(['2025-11-08', '2025-11-10', '2025-11-13']);
  });

  it('should generate a recurring series relative to a single event (days after)', () => {
    const definitions: EventDefinition[] = [
      { id: 'single-1', title: 'Single Event', date: '2025-12-01' },
      {
        id: 'def-3', groupId: 'group-3', title: 'Relative to Single Series',
        relativeRecurrence: { targetId: 'single-1', targetType: 'single', daysAfter: true, afterOffset: 5, daysBefore: false, beforeOffset: 1, dayOf: false }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, ''));
    const relativeEvents = result.current.filter(e => e.title === 'Relative to Single Series');
    expect(relativeEvents.length).toBe(1);
    expect(relativeEvents.map(e => e.date)).toEqual(['2025-12-06']);
  });

  it('should generate a recurring series relative to the start date (days before and after)', () => {
    const definitions: EventDefinition[] = [
      {
        id: 'def-4', groupId: 'group-4', title: 'Relative to Start Date Series',
        relativeRecurrence: { targetId: 'start-date', targetType: 'single', daysBefore: true, beforeOffset: 10, daysAfter: true, afterOffset: 36, dayOf: false }
      }
    ];
    const { result } = renderHook(() => useEventGenerator(definitions, '2025-01-15'));
    const relativeEvents = result.current.filter(e => e.title === 'Relative to Start Date Series');
    expect(relativeEvents.length).toBe(2);
    expect(relativeEvents.map(e => e.date).sort()).toEqual(['2025-01-05', '2025-02-20']);
  });
});
