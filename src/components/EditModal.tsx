import React, { useState } from 'react';
import { EventDefinition } from '../types';
import { EventInput } from '@fullcalendar/core';
import { daysOfWeek } from './RecurringEventForm';

interface EditModalProps {
    isOpen: boolean;
    event: EventDefinition | undefined;
    events: EventInput[];
    eventDefinitions: EventDefinition[];
    dateType: string;
    startDate: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function EditModal({ isOpen, event, events, eventDefinitions, startDate, dateType, onConfirm, onCancel }: EditModalProps) {
    if (!isOpen) return null;
    const [title, setTitle] = useState(event?.title);
    const [specificDate, setSpecificDate] = useState(event?.date);

    const [relativeOffset, setRelativeOffset] = useState<number>(event?.relativeTo?.offset || 1);
    const [relativeDirection, setRelativeDirection] = useState<'after' | 'before' | 'same'>('after');
    const [relativeTargetEventId, setRelativeTargetEventId] = useState<string>(event?.relativeTo?.targetId || '');
    const [startRecur, setStartRecur] = useState(event?.recurrence?.startRecur);
    const [endRecur, setEndRecur] = useState(event?.recurrence?.endRecur);
    const [recurrenceCycle, setRecurrenceCycle] = useState(event?.recurrence?.weeklySelections.length || 2);
    const [weeklySelections, setWeeklySelections] = useState<number[][]>(event?.recurrence?.weeklySelections || [[], []]);

    const [isDaysBeforeEnabled, setIsDaysBeforeEnabled] = useState(event?.relativeRecurrence?.daysBefore);
    const [daysBefore, setDaysBefore] = useState(event?.relativeRecurrence?.beforeOffset);
    const [isDaysAfterEnabled, setIsDaysAfterEnabled] = useState(event?.relativeRecurrence?.daysAfter);
    const [daysAfter, setDaysAfter] = useState(event?.relativeRecurrence?.afterOffset);
    const [isDayOfEnabled, setIsDayOfEnabled] = useState(event?.relativeRecurrence?.daysAfter);
    const [relativeTargetGroupId, setRelativeTargetGroupId] = useState<string>(event?.relativeRecurrence?.targetGroupId || '');
    const [relativeTargetId, setRelativeTargetId] = useState<string>(event?.relativeRecurrence?.targetId || '');

    const handleDayToggle = (dayValue: number, weekIndex: number) => {
        setWeeklySelections(currentSelections => {
            const newSelections = [...currentSelections];
            const week = [...(newSelections[weekIndex] || [])];
            if (week.includes(dayValue)) {
                newSelections[weekIndex] = week.filter(d => d !== dayValue);
            } else {
                newSelections[weekIndex] = [...week, dayValue];
            }
            return newSelections;
        });
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h4>{event?.title}</h4>
                <div className="form-group">
                    <label htmlFor="event-title">Event Name</label>
                    <input type="text" id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                {dateType === 'specific-recurrance' && (
                    <>
                        <div className="form-group">
                            <label htmlFor="recurrence-cycle">Repeats Every</label>
                            <select id="recurrence-cycle" value={recurrenceCycle} onChange={(e) => setRecurrenceCycle(Number(e.target.value))}>
                                <option value={1}>1 Week</option>
                                <option value={2}>2 Weeks</option>
                                <option value={3}>3 Weeks</option>
                                <option value={4}>4 Weeks</option>
                            </select>
                        </div>
                        {Array.from({ length: recurrenceCycle }).map((_, index) => (
                            <div className="form-group" key={index}>
                                <label>Week {index + 1} Repeats On</label>
                                <div className="day-picker">
                                    {daysOfWeek.map(day => (
                                        <button
                                            key={day.value}
                                            className={`day-button ${weeklySelections[index]?.includes(day.value) ? 'selected' : ''}`}
                                            onClick={() => handleDayToggle(day.value, index)}>
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="form-group">
                            <label htmlFor="start-recur">Start Date</label>
                            <input type="date" id="start-recur" value={startRecur} onChange={(e) => setStartRecur(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="end-recur">End Date</label>
                            <input type="date" id="end-recur" value={endRecur} onChange={(e) => setEndRecur(e.target.value)} />
                        </div>
                    </>
                )}
                {(dateType === 'relative-group' || dateType === 'relative-single') && (
                    <>
                        <div className="form-group">
                            <label htmlFor={dateType === 'relative-group' ? 'relative-target-group' : 'relative-target-single'}>Relative To</label>
                            {dateType === 'relative-group' && (
                                <select id="relative-target-group" className="relative-target-select" value={relativeTargetGroupId} onChange={(e) => setRelativeTargetGroupId(e.target.value)}>
                                    <option value="">Select a recurring event...</option>
                                    {eventDefinitions.filter(def => def.recurrence).map((def) => (
                                        <option key={def.id} value={def.groupId}>
                                            {def.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {dateType === 'relative-single' && (
                                <select id="relative-target-single" className="relative-target-select" value={relativeTargetId} onChange={(e) => setRelativeTargetId(e.target.value)}>
                                    <option value="">Select a single event or start date...</option>
                                    <option value="start-date">Start Date</option>
                                    {eventDefinitions.filter(def => def.date).map((def) => (
                                        <option key={def.id} value={def.id}>
                                            {def.title} ({def.date})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="relative-option-group">
                            <input type="checkbox" id="days-before-check" checked={isDaysBeforeEnabled} onChange={() => setIsDaysBeforeEnabled(!isDaysBeforeEnabled)} />
                            <input type="number" value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))} disabled={!isDaysBeforeEnabled} />
                            <label htmlFor="days-before-check">Days Before</label>
                        </div>
                        <div className="relative-option-group">
                            <input type="checkbox" id="days-after-check" checked={isDaysAfterEnabled} onChange={() => setIsDaysAfterEnabled(!isDaysAfterEnabled)} />
                            <input type="number" value={daysAfter} onChange={(e) => setDaysAfter(Number(e.target.value))} disabled={!isDaysAfterEnabled} />
                            <label htmlFor="days-after-check">Days After</label>
                        </div>
                        <div className="relative-option-group">
                            <input type="checkbox" id="day-of-check" checked={isDayOfEnabled} onChange={() => setIsDayOfEnabled(!isDayOfEnabled)} />
                            <label htmlFor="day-of-check">Day Of</label>
                        </div>
                    </>
                )}
                <div className="modal-actions">
                    <button className="modal-button submit" onClick={onConfirm}>Update</button>
                    <button className="modal-button cancel" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
