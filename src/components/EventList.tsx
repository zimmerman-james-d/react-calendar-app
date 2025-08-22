import React from 'react';
import { EventInput } from '@fullcalendar/core';

interface EventListProps {
  events: EventInput[];
}

export function EventList({ events }: EventListProps) {
  return (
    <ul className="event-list">
      {events.map((event, index) => (
        <li key={index} className="event-list-item">
          <strong>{event.title}</strong>
          <br />
          <small>{event.date?.toString()}</small>
        </li>
      ))}
    </ul>
  );
}
