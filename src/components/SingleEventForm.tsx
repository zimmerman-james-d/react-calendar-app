import React, { useState, useEffect } from 'react';
import { EventDefinition } from '../types';
import { EventInput } from '@fullcalendar/core';

interface SingleEventFormProps {
    onAddEventDefinition: (definition: EventDefinition) => void;
    onUpdateEventDefinition: (definition: EventDefinition) => void; // New prop for updating
    events: EventInput[];
    startDate: string;
    editingEvent: EventDefinition | null; // New prop for editing
    setEditingEvent: (event: EventDefinition | null) => void; // New prop to clear editing state
}

export function SingleEventForm({
    onAddEventDefinition,
    onUpdateEventDefinition,
    events,
    startDate,
    editingEvent,
    setEditingEvent
}: SingleEventFormProps) {
    const [title, setTitle] = useState('');
    const [specificDate, setSpecificDate] = useState('');
    const [dateType, setDateType] = useState('specific');
    
    const [relativeOffset, setRelativeOffset] = useState<number>(1);
    const [relativeDirection, setRelativeDirection] = useState<'after' | 'before' | 'same'>('after');
    const [relativeTargetEventId, setRelativeTargetEventId] = useState<string>('');

    useEffect(() => {
        if (editingEvent) {
            setTitle(editingEvent.title);
            if (editingEvent.date) {
                setDateType('specific');
                setSpecificDate(editingEvent.date);
            } else if (editingEvent.relativeTo) {
                setDateType('relative');
                setRelativeTargetEventId(editingEvent.relativeTo.targetId);
                if (editingEvent.relativeTo.offset === 0) {
                    setRelativeDirection('same');
                    setRelativeOffset(1); // Offset doesn't matter for 'same'
                } else if (editingEvent.relativeTo.offset > 0) {
                    setRelativeDirection('after');
                    setRelativeOffset(editingEvent.relativeTo.offset);
                } else {
                    setRelativeDirection('before');
                    setRelativeOffset(Math.abs(editingEvent.relativeTo.offset));
                }
            }
        } else {
            // Clear form when no event is being edited
            setTitle('');
            setSpecificDate('');
            setDateType('specific');
            setRelativeOffset(1);
            setRelativeDirection('after');
            setRelativeTargetEventId('');
        }
    }, [editingEvent]);

    const handleSave = () => {
        if (!title) {
            alert('Please enter an event title.');
            return;
        }

        const eventToSave: EventDefinition = editingEvent ? { ...editingEvent } : { id: crypto.randomUUID() };
        eventToSave.title = title;

        if (dateType === 'specific') {
            if (!specificDate) {
                alert('Please select a specific date.');
                return;
            }
            eventToSave.date = specificDate;
            eventToSave.relativeTo = undefined; // Clear relativeTo if switching to specific
        } else if (dateType === 'relative') {
            if (!relativeTargetEventId) {
                alert('Please select a target event.');
                return;
            }
            let offset = relativeDirection === 'same' ? 0 : relativeOffset;
            if (relativeDirection === 'before') {
                offset *= -1;
            }
            eventToSave.relativeTo = {
                targetId: relativeTargetEventId,
                offset: offset,
            };
            eventToSave.date = undefined; // Clear date if switching to relative
        }

        if (editingEvent) {
            onUpdateEventDefinition(eventToSave);
        } else {
            onAddEventDefinition(eventToSave);
        }
        setEditingEvent(null); // Clear editing state after save
    };

    const handleCancelEdit = () => {
        setEditingEvent(null);
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
            <button onClick={handleSave} className="save-event-button">{editingEvent ? 'Update Event' : 'Add Event'}</button>
            {editingEvent && (
                <button onClick={handleCancelEdit} className="cancel-edit-button">Cancel Edit</button>
            )}
        </>
    );
}
