import { EventInput } from '@fullcalendar/core';

export interface PrintMonth {
  year: number;
  month: number; // 0-indexed, matches Date's getUTCMonth()
  hasEvents: boolean;
}

// Range = month(start date) -> month(last scheduled event), inclusive. The
// start date anchors the beginning of the range rather than the earliest
// event, since events can be offset before it (negative offsets) and
// shouldn't pull the range backward. Returns null when there is nothing to
// print a plan for, signaling the caller to fall back to printing just the
// on-screen month.
export function getPrintMonths(startDate: string, events: EventInput[]): PrintMonth[] | null {
  const eventDates = events
    .map(e => e.date as string | undefined)
    .filter((d): d is string => !!d)
    .sort();

  if (eventDates.length === 0 || !startDate) {
    return null;
  }

  const [startYear, startMonthNum] = startDate.split('-').map(Number);
  const startMonthIndex = startYear * 12 + (startMonthNum - 1);

  const lastDate = eventDates[eventDates.length - 1];
  const [lastYear, lastMonthNum] = lastDate.split('-').map(Number);
  const lastMonthIndex = lastYear * 12 + (lastMonthNum - 1);

  const finalMonthIndex = Math.max(startMonthIndex, lastMonthIndex);

  const eventMonthKeys = new Set(
    eventDates.map(d => {
      const [y, m] = d.split('-').map(Number);
      return y * 12 + (m - 1);
    })
  );

  const months: PrintMonth[] = [];
  for (let index = startMonthIndex; index <= finalMonthIndex; index++) {
    const year = Math.floor(index / 12);
    const month = index % 12;
    months.push({ year, month, hasEvents: eventMonthKeys.has(index) });
  }

  return months;
}
