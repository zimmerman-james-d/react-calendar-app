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
      const deletedEvent = prev.find(def => def.id === id);
      const deletedEventGroupId = deletedEvent?.groupId;

      return prev.map(def => {
        if (def.id === id) {
          return { ...def, deleted: true };
        }
        if (def.relativeTo?.targetId === id ||
            (deletedEvent?.recurrence && def.relativeTo?.targetId?.startsWith(id + '-')) ||
            def.relativeRecurrence?.targetId === id ||
            (deletedEventGroupId && def.relativeRecurrence?.targetGroupId === deletedEventGroupId)) {
          return { ...def, deleted: true };
        }
        return def;
      });
    });
  };

  const handlePermanentDeleteEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const deletedEvent = prev.find(def => def.id === id);
      const deletedEventGroupId = deletedEvent?.groupId;

      return prev.filter(def => {
        if (def.id === id) {
          return false; // Permanently delete this event
        }
        // Also permanently delete events that were relative to the deleted event
        if (def.relativeTo?.targetId === id ||
            (deletedEvent?.recurrence && def.relativeTo?.targetId?.startsWith(id + '-')) ||
            def.relativeRecurrence?.targetId === id ||
            (deletedEventGroupId && def.relativeRecurrence?.targetGroupId === deletedEventGroupId)) {
          return false; // Permanently delete this dependent event
        }
        return true; // Keep other events
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
        onRemoveEventDefinition={handleDeleteEventDefinition}
        onRestoreEventDefinition={handleRestoreEventDefinition}
        onPermanentDeleteEventDefinition={handlePermanentDeleteEventDefinition}
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
