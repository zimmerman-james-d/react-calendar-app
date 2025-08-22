import { EventInput } from '@fullcalendar/core';

export function generateRecurringWeeklyEvents(
    recurringTitle: string,
    startRecur: string,
    endRecur: string,
    weeklySelections: number[][],
    recurrenceCycle: number
): EventInput[] {
    const newEvents: EventInput[] = [];
    
    if (!recurringTitle || !startRecur || !endRecur || weeklySelections.every(week => week.length === 0)) {
        return newEvents;
    }
    
    const [startYear, startMonth, startDay] = startRecur.split('-').map(Number);
    const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));

    const [endYear, endMonth, endDay] = endRecur.split('-').map(Number);
    const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

    if (startDate > endDate) return newEvents;
    
    const firstSunday = new Date(startDate);
    firstSunday.setUTCDate(firstSunday.getUTCDate() - firstSunday.getUTCDay());

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getUTCDay();
        const diffTime = currentDate.getTime() - firstSunday.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);
        
        const weekInCycle = weekIndex % recurrenceCycle;

        if (weeklySelections[weekInCycle]?.includes(dayOfWeek)) {
            newEvents.push({ title: recurringTitle, date: currentDate.toISOString().split('T')[0] });
        }

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return newEvents;
};

export function generateRecurringRelativeDate(
    relativeDate: Date,
    offset: number
): Date {
    relativeDate.setUTCDate(relativeDate.getUTCDate() + offset)
    console.log("RelativeDate", relativeDate)
    return relativeDate
}