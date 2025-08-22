import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Sidebar } from './Sidebar';
import { EventInput } from '@fullcalendar/core';

const initialEvents: EventInput[] = [];

export function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState<EventInput[]>(initialEvents);
  const [startDate, setStartDate] = useState<string>('');

  const handleAddEvent = (newEvent: EventInput | EventInput[]) => {
    if (Array.isArray(newEvent)) {
      setEvents(prevEvents => [...prevEvents, ...newEvent]);
    } else {
      setEvents(prevEvents => [...prevEvents, newEvent]);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onAddEvent={handleAddEvent}
        events={events}
        // Pass the new state and setter down
        startDate={startDate}
        onStartDateChange={setStartDate}
      />
      
      <div className="main-content">
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="95vh"
            headerToolbar={{
              left: 'prev',
              center: 'title',
              right: 'next'
            }}
            weekends={true}
            events={events}
          />
        </div>
      </div>
    </div>
  );
}
