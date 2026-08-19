import { getPrintMonths } from '../src/utils/printMonths';

describe('getPrintMonths', () => {
  it('returns null when there are no events at all', () => {
    expect(getPrintMonths('2026-01-15', [])).toBeNull();
  });

  it('returns null when there is no start date', () => {
    expect(getPrintMonths('', [{ date: '2026-01-20' }])).toBeNull();
  });

  it('produces a single month when all events fall in the start month', () => {
    const months = getPrintMonths('2026-03-01', [{ date: '2026-03-05' }, { date: '2026-03-20' }]);
    expect(months).toEqual([{ year: 2026, month: 2, hasEvents: true }]);
  });

  it('spans from the start month through the last event month, inclusive', () => {
    const months = getPrintMonths('2026-01-10', [{ date: '2026-01-15' }, { date: '2026-04-02' }]);
    expect(months).toEqual([
      { year: 2026, month: 0, hasEvents: true },
      { year: 2026, month: 1, hasEvents: false },
      { year: 2026, month: 2, hasEvents: false },
      { year: 2026, month: 3, hasEvents: true },
    ]);
  });

  it('spans a year boundary', () => {
    const months = getPrintMonths('2025-12-01', [{ date: '2025-12-10' }, { date: '2026-02-01' }]);
    expect(months).toEqual([
      { year: 2025, month: 11, hasEvents: true },
      { year: 2026, month: 0, hasEvents: false },
      { year: 2026, month: 1, hasEvents: true },
    ]);
  });

  it('anchors the range to the start month even when an event is offset earlier', () => {
    // A negative offset can put an event before the plan's start date, but the
    // range should not extend backward to include that earlier month.
    const months = getPrintMonths('2026-05-15', [{ date: '2026-04-28' }, { date: '2026-05-20' }]);
    expect(months).toEqual([{ year: 2026, month: 4, hasEvents: true }]);
  });

  it('ignores events without a date', () => {
    const months = getPrintMonths('2026-06-01', [{ title: 'no date' }, { date: '2026-06-10' }]);
    expect(months).toEqual([{ year: 2026, month: 5, hasEvents: true }]);
  });
});
