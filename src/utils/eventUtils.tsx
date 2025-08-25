import { useMemo } from 'react';
import { EventInput } from '@fullcalendar/core';
import { EventDefinition } from '../types';

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
    const newDate = new Date(relativeDate.getTime());
    newDate.setUTCDate(newDate.getUTCDate() + offset);
    return newDate;
}

export function useEventGenerator(eventDefinitions: EventDefinition[], startDate: string): EventInput[] {
  return useMemo(() => {
    const generatedEvents: EventInput[] = [];

    // First pass: Generate all non-relative events
    for (const def of eventDefinitions) {
      if (def.date) {
        generatedEvents.push({ id: def.id, title: def.title, date: def.date });
      } else if (def.recurrence) {
        const weeklyEvents = generateRecurringWeeklyEvents(
            def.title,
            def.recurrence.startRecur,
            def.recurrence.endRecur,
            def.recurrence.weeklySelections,
            def.recurrence.recurrenceCycle
        ).map(e => ({ ...e, id: `${def.id}-${e.date}`, groupId: def.groupId }));
        generatedEvents.push(...weeklyEvents);
      }
    }

    // Second pass: Generate relative events
    for (const def of eventDefinitions) {
        if (def.relativeTo) {
            let targetDate: Date | null = null;
            if (def.relativeTo.targetId === 'start-date') {
                if (startDate) {
                    const [y, m, d] = startDate.split('-').map(Number);
                    targetDate = new Date(Date.UTC(y, m - 1, d));
                }
            } else {
                const targetEvent = generatedEvents.find(e => e.id === def.relativeTo!.targetId);
                if (targetEvent?.date) {
                    const [y, m, d] = targetEvent.date.toString().split('-').map(Number);
                    targetDate = new Date(Date.UTC(y, m - 1, d));
                }
            }

            if (targetDate) {
                const newDate = generateRecurringRelativeDate(targetDate, def.relativeTo.offset);
                generatedEvents.push({ id: def.id, title: def.title, date: newDate.toISOString().split('T')[0] });
            }
        }
        else if (def.relativeRecurrence) {
            const targetInstances = generatedEvents.filter(e => e.groupId === def.relativeRecurrence!.targetGroupId);
            for (const instance of targetInstances) {
                if (instance.date) {
                    const baseDate = new Date(instance.date.toString());
                    if(def.relativeRecurrence.dayOf) {
                         generatedEvents.push({ id: `${def.id}-${instance.id}-dayof`, groupId: def.groupId, title: def.title, date: baseDate.toISOString().split('T')[0] });
                    }
                    if(def.relativeRecurrence.daysBefore) {
                        const beforeDate = generateRecurringRelativeDate(baseDate, def.relativeRecurrence.beforeOffset * -1);
                        generatedEvents.push({ id: `${def.id}-${instance.id}-before`, groupId: def.groupId, title: def.title, date: beforeDate.toISOString().split('T')[0] });
                    }
                    if(def.relativeRecurrence.daysAfter) {
                        const afterDate = generateRecurringRelativeDate(baseDate, def.relativeRecurrence.afterOffset);
                        generatedEvents.push({ id: `${def.id}-${instance.id}-after`, groupId: def.groupId, title: def.title, date: afterDate.toISOString().split('T')[0] });
                    }
                }
            }
        }
    }

    return generatedEvents;
  }, [eventDefinitions, startDate]);
}
