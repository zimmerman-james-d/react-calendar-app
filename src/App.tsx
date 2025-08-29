import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Sidebar } from './Sidebar';
import { EventDefinition } from './types';
import { useEventGenerator } from './utils/eventUtils';

export function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [calendarName, setCalendarName] = useState<string>('');
  const calendarRef = useRef<FullCalendar>(null);

  const calendarEvents = useEventGenerator(eventDefinitions, startDate);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const handleAddEventDefinition = (newDefinition: EventDefinition) => {
    setEventDefinitions(prev => [...prev, newDefinition]);
  };

  const handleDeleteEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const updatedDefinitions = prev.map(def =>
        def.id === id ? { ...def, deleted: true } : def
      );

      // Now, soft-delete any events that are relative to the deleted event
      return updatedDefinitions.map(def => {
        if (def.relativeTo?.targetId === id ||
            def.relativeRecurrence?.targetId === id ||
            (def.relativeRecurrence?.targetGroupId && updatedDefinitions.find(d => d.id === id)?.groupId && def.relativeRecurrence.targetGroupId === updatedDefinitions.find(d => d.id === id)?.groupId)) {
          return { ...def, deleted: true };
        }
        return def;
      });
    });
  };

  const handleRestoreEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const updatedDefinitions = prev.map(def =>
        def.id === id ? { ...def, deleted: false } : def
      );

      // Now, restore any events that were relative to the restored event
      return updatedDefinitions.map(def => {
        if (def.relativeTo?.targetId === id ||
            def.relativeRecurrence?.targetId === id ||
            (def.relativeRecurrence?.targetGroupId && prev.find(d => d.id === id)?.groupId && def.relativeRecurrence.targetGroupId === prev.find(d => d.id === id)?.groupId)) {
          return { ...def, deleted: false };
        }
        return def;
      });
    });
  };

  const handleLoad = (loadedData: { calendarName: string, startDate: string, eventDefinitions: EventDefinition[] }) => {
    setCalendarName(loadedData.calendarName);
    setStartDate(loadedData.startDate);
    setEventDefinitions(loadedData.eventDefinitions);
    alert("Schedule loaded successfully!");
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onAddEventDefinition={handleAddEventDefinition}
        onLoad={handleLoad}
        eventDefinitions={eventDefinitions}
        events={calendarEvents}
        startDate={startDate}
        onStartDateChange={setStartDate}
        calendarName={calendarName}
        onCalendarNameChange={setCalendarName}
        onDeleteEventDefinition={handleDeleteEventDefinition}
        onRestoreEventDefinition={handleRestoreEventDefinition}
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
