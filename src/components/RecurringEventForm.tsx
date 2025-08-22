import React, { useState, useEffect } from 'react';
import { EventDefinition } from '../types';

interface RecurringEventFormProps {
    onAddEventDefinition: (definition: EventDefinition) => void;
    eventDefinitions: EventDefinition[];
}

const daysOfWeek = [
    { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }
];

export function RecurringEventForm({ onAddEventDefinition, eventDefinitions }: RecurringEventFormProps) {
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
    const [relativeTargetGroupId, setRelativeTargetGroupId] = useState<string>('');

    useEffect(() => {
        setWeeklySelections(currentSelections => Array.from({ length: recurrenceCycle }, (_, i) => currentSelections[i] || []));
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
        if (!title) {
            alert('Please enter a title');
            return;
        }

        const newDefinition: Partial<EventDefinition> = {
            id: crypto.randomUUID(),
            groupId: crypto.randomUUID(),
            title,
        };

        if (dateType === 'specific') {
            if (!startRecur || !endRecur || weeklySelections.every(w => w.length === 0)) {
                alert('Please fill out all fields for the recurrence.');
                return;
            }
            newDefinition.recurrence = {
                startRecur,
                endRecur,
                weeklySelections,
                recurrenceCycle,
            };
        } else if (dateType === 'relative') {
            if (!relativeTargetGroupId) {
                alert('Please select a target recurring event.');
                return;
            }
            newDefinition.relativeRecurrence = {
                targetGroupId: relativeTargetGroupId,
                daysBefore: isDaysBeforeEnabled,
                beforeOffset: daysBefore,
                daysAfter: isDaysAfterEnabled,
                afterOffset: daysAfter,
                dayOf: isDayOfEnabled,
            };
        }

        onAddEventDefinition(newDefinition as EventDefinition);
        // Reset form state
        setTitle('');
        setStartRecur('');
        setEndRecur('');
        setWeeklySelections(Array.from({ length: recurrenceCycle }, () => []));
        setRelativeTargetGroupId('');
        setIsDaysBeforeEnabled(false);
        setIsDaysAfterEnabled(false);
        setIsDayOfEnabled(false);
        setDaysBefore(1);
        setDaysAfter(1);
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
                        <label htmlFor="relative-target-group">Relative To</label>
                        <select id="relative-target-group" className="relative-target-select" value={relativeTargetGroupId} onChange={(e) => setRelativeTargetGroupId(e.target.value)}>
                            <option value="">Select a recurring event...</option>
                            {eventDefinitions.filter(def => def.recurrence).map((def) => (
                                <option key={def.id} value={def.groupId}>
                                    {def.title}
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
