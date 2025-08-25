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
  const calendarRef = useRef<FullCalendar>(null);

  // Use the custom hook from its new location
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
