import { generateRecurringWeeklyEvents, generateRecurringRelativeDate } from '../src/utils/eventUtils';

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
