import React, { useState, useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Sidebar } from './Sidebar';
import { EventInput } from '@fullcalendar/core';
import { EventDefinition } from './types';
import { generateRecurringRelativeDate, generateRecurringWeeklyEvents } from './utils/eventUtils';

export function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const calendarRef = useRef<FullCalendar>(null);

  // Effect to resize the calendar when the sidebar toggles
  useEffect(() => {
    // Give the sidebar transition time to complete
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    }, 350); // A bit longer than the CSS transition (0.3s)

    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const calendarEvents = useMemo((): EventInput[] => {
    const generatedEvents: EventInput[] = [];
    const definitionMap = new Map(eventDefinitions.map(def => [def.id, def]));

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

  const handleAddEventDefinition = (newDefinition: EventDefinition) => {
    setEventDefinitions(prev => [...prev, newDefinition]);
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onAddEventDefinition={handleAddEventDefinition}
        eventDefinitions={eventDefinitions}
        events={calendarEvents}
        startDate={startDate}
        onStartDateChange={setStartDate}
      />
      
      <div className="main-content">
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="95vh"
            headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
            weekends={true}
            events={calendarEvents}
          />
        </div>
      </div>
    </div>
  );
}
