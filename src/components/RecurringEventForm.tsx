import React, { useState, useEffect } from 'react';
import { EventInput } from '@fullcalendar/core';
import { generateRecurringEvents } from '../utils/eventUtils';

interface RecurringEventFormProps {
    onAddEvent: (events: EventInput[]) => void;
}

const daysOfWeek = [
    { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }
];

export function RecurringEventForm({ onAddEvent }: RecurringEventFormProps) {
    const [title, setTitle] = useState('');
    const [startRecur, setStartRecur] = useState('');
    const [endRecur, setEndRecur] = useState('');
    const [recurrenceCycle, setRecurrenceCycle] = useState(2);
    const [weeklySelections, setWeeklySelections] = useState<number[][]>([[], []]);

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
        const newEvents = generateRecurringEvents(
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
            <button onClick={handleSave} className="save-event-button">Add Recurring Event</button>
        </>
    );
}
