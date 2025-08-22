import React, { useState } from 'react';
import { EventInput } from '@fullcalendar/core';

interface SingleEventFormProps {
    onAddEvent: (event: EventInput) => void;
    events: EventInput[];
    startDate: string;
}

export function SingleEventForm({ onAddEvent, events, startDate }: SingleEventFormProps) {
    const [title, setTitle] = useState('');
    const [specificDate, setSpecificDate] = useState('');
    const [dateType, setDateType] = useState('specific');
    
    const [relativeOffset, setRelativeOffset] = useState<number>(1);
    const [relativeDirection, setRelativeDirection] = useState<'before' | 'after' | 'same'>('after');
    const [relativeTargetEventKey, setRelativeTargetEventKey] = useState<string>('');

    const handleSave = () => {
        if (!title) {
            alert('Please enter an event title.');
            return;
        }

        let eventDate = '';

        if (dateType === 'specific') {
            if (!specificDate) {
                alert('Please select a specific date.');
                return;
            }
            eventDate = specificDate;
        } else if (dateType === 'relative') {
            if (!relativeTargetEventKey) {
                alert('Please select a target event.');
                return;
            }

            let targetDateStr: string | undefined;

            if (relativeTargetEventKey === 'start-date') {
                targetDateStr = startDate;
            } else {
                const targetEvent = events.find(e => `${e.title}-${e.date}` === relativeTargetEventKey);
                targetDateStr = targetEvent?.date?.toString();
            }
            
            if (!targetDateStr) {
                alert('Target event not found or has no date.');
                return;
            }

            const [targetYear, targetMonth, targetDay] = targetDateStr.split('-').map(Number);
            const baseDate = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay));

            if (relativeDirection === 'after') {
                baseDate.setUTCDate(baseDate.getUTCDate() + relativeOffset);
            } else if (relativeDirection === 'before') {
                baseDate.setUTCDate(baseDate.getUTCDate() - relativeOffset);
            }
            eventDate = baseDate.toISOString().split('T')[0];
        }

        onAddEvent({ title, date: eventDate });
        setTitle('');
        setSpecificDate('');
        setRelativeOffset(1);
        setRelativeTargetEventKey('');
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
                    <select className="relative-target-select" value={relativeTargetEventKey} onChange={(e) => setRelativeTargetEventKey(e.target.value)}>
                        <option value="">Select an event...</option>
                        {startDate && (
                            <option value="start-date">
                                Start Date ({startDate})
                            </option>
                        )}
                        {events.map((event, index) => (
                            <option key={index} value={`${event.title}-${event.date}`}>
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
