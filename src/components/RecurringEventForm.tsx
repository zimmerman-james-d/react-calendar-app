import React, { useState, useEffect } from 'react';
import { EventInput } from '@fullcalendar/core';
import { generateRecurringWeeklyEvents, generateRecurringRelativeDate } from '../utils/eventUtils';

interface RecurringEventFormProps {
    onAddEvent: (events: EventInput[]) => void;
    // Add events and startDate to props to populate the target dropdown
    events: EventInput[];
    startDate: string;
}

const daysOfWeek = [
    { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }
];

export function RecurringEventForm({ onAddEvent, events, startDate }: RecurringEventFormProps) {
    const [title, setTitle] = useState('');
    const [startRecur, setStartRecur] = useState('');
    const [endRecur, setEndRecur] = useState('');
    const [recurrenceCycle, setRecurrenceCycle] = useState(2);
    const [weeklySelections, setWeeklySelections] = useState<number[][]>([[], []]);
    const [dateType, setDateType] = useState('specific');

    const [isDaysBeforeEnabled, setIsDaysBeforeEnabled] = useState(false);
    const [daysBefore, setDaysBefore] = useState(1);
    const [isDaysAfterEnabled, setIsDaysAfterEnabled] = useState(false);
    const [daysAfter, setDaysAfter] = useState(1);
    const [isDayOfEnabled, setIsDayOfEnabled] = useState(false);
    const [relativeTargetEventKey, setRelativeTargetEventKey] = useState<string>('');


    useEffect(() => {
        setWeeklySelections(currentSelections => {
            const newSelections = Array.from({ length: recurrenceCycle }, (_, i) => currentSelections[i] || []);
            return newSelections;
        });
    }, [recurrenceCycle]);

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

    const handleSave = () => {
        if (dateType === 'specific') {
            const newEvents = generateRecurringWeeklyEvents(
                title,
                startRecur,
                endRecur,
                weeklySelections,
                recurrenceCycle
            );

            if (newEvents.length === 0) {
                alert('Please fill out all fields and select at least one day.');
                return;
            }
            onAddEvent(newEvents);
        } else if (dateType === 'relative') {
            console.log('Relative Date')
            const newEvents: EventInput[] = [];

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
            const beforeDate = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay));
            const afterDate = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay));
            console.log(daysBefore, daysAfter)
            if (isDaysBeforeEnabled) {
                newEvents.push({ title: title, date: generateRecurringRelativeDate(beforeDate, daysBefore * -1).toISOString().split('T')[0] })
            }
            if (isDaysAfterEnabled) {
                newEvents.push({ title: title, date: generateRecurringRelativeDate(afterDate, daysAfter).toISOString().split('T')[0] })
            }
            if (isDayOfEnabled) {
                newEvents.push({ title: title, date: baseDate.toISOString().split('T')[0] })
            }
            console.log(newEvents)
            onAddEvent(newEvents);
        }

        setTitle('');
        setWeeklySelections(Array.from({ length: recurrenceCycle }, () => []));
        setStartRecur('');
        setEndRecur('');
    };

    return (
        <>
            <div className="form-group">
                <label htmlFor="recurring-title">Event Name</label>
                <input type="text" id="recurring-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="form-group">
                <label htmlFor="recurring-date-type">Date Type</label>
                <select id="recurring-date-type" value={dateType} onChange={(e) => setDateType(e.target.value)}>
                    <option value="specific">Specific Dates</option>
                    <option value="relative">Relative to another event</option>
                </select>
            </div>

            {dateType === 'specific' && (
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

            {dateType === 'relative' && (
                <>
                    <div className="form-group">
                        <label>Relative To</label>
                        <select className="relative-target-select" value={relativeTargetEventKey} onChange={(e) => setRelativeTargetEventKey(e.target.value)}>
                            <option value="">Select an event...</option>
                            {startDate && (
                                <option value="start-date">
                                    Start Date ({startDate})
                                </option>
                            )}
                            {/* This will need to be updated to show event series, not individual events */}
                            {events.map((event, index) => (
                                <option key={index} value={`${event.title}-${event.date}`}>
                                    {event.title} ({event.date?.toString()})
                                </option>
                            ))}
                        </select>
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

            <button onClick={handleSave} className="save-event-button">Add Recurring Event</button>
        </>
    );
}
