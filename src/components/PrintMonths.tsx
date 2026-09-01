import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventInput } from '@fullcalendar/core';
import { PrintMonth } from '../utils/printMonths';

interface PrintMonthsProps {
  months: PrintMonth[];
  calendarName: string;
  events: EventInput[];
  registerRef: (index: number, instance: FullCalendar | null) => void;
}

export function PrintMonths({ months, calendarName, events, registerRef }: PrintMonthsProps) {
  return (
    <div className="print-months-container">
      {months.map((printMonth, index) => (
        <div className="print-month-page" key={`${printMonth.year}-${printMonth.month}`}>
          {calendarName && <h1 className="print-title">{calendarName}</h1>}
          <FullCalendar
            ref={instance => registerRef(index, instance)}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            initialDate={new Date(printMonth.year, printMonth.month, 1)}
            headerToolbar={{ left: '', center: 'title', right: '' }}
            // FullCalendar pads every month out to six week rows by default.
            // On paper that spends a sixth of the sheet on a row of greyed-out
            // next-month dates and squeezes the real weeks to make room for it.
            // Rendering only the weeks the month spans lets the print CSS
            // divide the sheet across 4, 5 or 6 rows instead.
            fixedWeekCount={false}
            height="auto"
            weekends={true}
            events={events}
          />
          {!printMonth.hasEvents && (
            <p className="print-no-events-note">No scheduled events this month.</p>
          )}
          {index === months.length - 1 && (
            <p className="print-end-of-plan">— End of Current Phase —</p>
          )}
        </div>
      ))}
    </div>
  );
}
