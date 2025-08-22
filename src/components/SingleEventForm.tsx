import React, { useState } from 'react';
import { EventDefinition } from '../types';
import { EventInput } from '@fullcalendar/core';

interface SingleEventFormProps {
    onAddEventDefinition: (definition: EventDefinition) => void;
    events: EventInput[];
    startDate: string;
}

export function SingleEventForm({ onAddEventDefinition, events, startDate }: SingleEventFormProps) {
    const [title, setTitle] = useState('');
    const [specificDate, setSpecificDate] = useState('');
    const [dateType, setDateType] = useState('specific');
    
    const [relativeOffset, setRelativeOffset] = useState<number>(1);
    const [relativeDirection, setRelativeDirection] = useState<'after' | 'before' | 'same'>('after');
    const [relativeTargetEventId, setRelativeTargetEventId] = useState<string>('');

    const handleSave = () => {
        if (!title) {
            alert('Please enter an event title.');
            return;
        }

        const newDefinition: Partial<EventDefinition> = {
            id: crypto.randomUUID(),
            title,
        };

        if (dateType === 'specific') {
            if (!specificDate) {
                alert('Please select a specific date.');
                return;
            }
            newDefinition.date = specificDate;
        } else if (dateType === 'relative') {
            if (!relativeTargetEventId) {
                alert('Please select a target event.');
                return;
            }
            let offset = relativeDirection === 'same' ? 0 : relativeOffset;
            if (relativeDirection === 'before') {
                offset *= -1;
            }
            newDefinition.relativeTo = {
                targetId: relativeTargetEventId,
                offset: offset,
            };
        }

        onAddEventDefinition(newDefinition as EventDefinition);
        setTitle('');
        setSpecificDate('');
        setRelativeOffset(1);
        setRelativeTargetEventId('');
    };

    return (
        <>
            <div className="form-group">
                <label htmlFor="event-title">Event Name</label>
                <input type="text" id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="single-date-type">Date Type</label>
                <select id="single-date-type" value={dateType} onChange={(e) => setDateType(e.target.value)}>
                    <option value="specific">Specific Date</option>
                    <option value="relative">Relative to another event</option>
                </select>
            </div>
            {dateType === 'specific' && (
                <div className="form-group">
                    <label htmlFor="event-date">Date</label>
                    <input type="date" id="event-date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} />
                </div>
            )}
            {dateType === 'relative' && (
                <div className="form-group">
                    <label>Relative Date</label>
                    <div className="relative-date-controls">
                        <input 
                            type="number" 
                            className="relative-offset-input"
                            value={relativeOffset}
                            onChange={(e) => setRelativeOffset(Number(e.target.value))}
                            disabled={relativeDirection === 'same'}
                        />
                        <select className="relative-direction-select" value={relativeDirection} onChange={(e) => setRelativeDirection(e.target.value as any)}>
                            <option value="after">Days After</option>
                            <option value="before">Days Before</option>
                            <option value="same">On the same day as</option>
                        </select>
                    </div>
                    <select className="relative-target-select" value={relativeTargetEventId} onChange={(e) => setRelativeTargetEventId(e.target.value)}>
                        <option value="">Select an event...</option>
                        {startDate && (
                            <option value="start-date">
                                Start Date ({startDate})
                            </option>
                        )}
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.title} ({event.date?.toString()})
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <button onClick={handleSave} className="save-event-button">Add Event</button>
        </>
    );
}
