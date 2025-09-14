import React, { useState, useEffect } from 'react';
import { EventDefinition } from '../types';

interface RecurringEventFormProps {
    onAddEventDefinition: (definition: EventDefinition) => void;
    onUpdateEventDefinition: (definition: EventDefinition) => void; // New prop for updating
    eventDefinitions: EventDefinition[];
    editingEvent: EventDefinition | null; // New prop for editing
    setEditingEvent: (event: EventDefinition | null) => void; // New prop to clear editing state
}

const daysOfWeek = [
    { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }
];

export function RecurringEventForm({
    onAddEventDefinition,
    onUpdateEventDefinition,
    eventDefinitions,
    editingEvent,
    setEditingEvent
}: RecurringEventFormProps) {
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
    const [relativeTargetId, setRelativeTargetId] = useState<string>('');

    useEffect(() => {
        setWeeklySelections(currentSelections => Array.from({ length: recurrenceCycle }, (_, i) => currentSelections[i] || []));
    }, [recurrenceCycle]);

    useEffect(() => {
        if (editingEvent) {
            setTitle(editingEvent.title);
            if (editingEvent.recurrence) {
                setDateType('specific');
                setStartRecur(editingEvent.recurrence.startRecur);
                setEndRecur(editingEvent.recurrence.endRecur);
                setRecurrenceCycle(editingEvent.recurrence.recurrenceCycle);
                setWeeklySelections(editingEvent.recurrence.weeklySelections);
            } else if (editingEvent.relativeRecurrence) {
                if (editingEvent.relativeRecurrence.targetType === 'group') {
                    setDateType('relative-group');
                    setRelativeTargetGroupId(editingEvent.relativeRecurrence.targetGroupId || '');
                } else if (editingEvent.relativeRecurrence.targetType === 'single') {
                    setDateType('relative-single');
                    setRelativeTargetId(editingEvent.relativeRecurrence.targetId || '');
                }
                setIsDaysBeforeEnabled(editingEvent.relativeRecurrence.daysBefore || false);
                setDaysBefore(editingEvent.relativeRecurrence.beforeOffset || 1);
                setIsDaysAfterEnabled(editingEvent.relativeRecurrence.daysAfter || false);
                setDaysAfter(editingEvent.relativeRecurrence.afterOffset || 1);
                setIsDayOfEnabled(editingEvent.relativeRecurrence.dayOf || false);
            }
        } else {
            // Clear form when no event is being edited
            setTitle('');
            setStartRecur('');
            setEndRecur('');
            setRecurrenceCycle(2);
            setWeeklySelections([[], []]);
            setDateType('specific');
            setIsDaysBeforeEnabled(false);
            setDaysBefore(1);
            setIsDaysAfterEnabled(false);
            setDaysAfter(1);
            setIsDayOfEnabled(false);
            setRelativeTargetGroupId('');
            setRelativeTargetId('');
        }
    }, [editingEvent]);

    useEffect(() => {
        if (dateType === 'relative-group') {
            setRelativeTargetId('');
        } else if (dateType === 'relative-single') {
            setRelativeTargetGroupId('');
        }
    }, [dateType]);

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

        const eventToSave: EventDefinition = editingEvent ? { ...editingEvent } : { id: crypto.randomUUID(), groupId: crypto.randomUUID() };
        eventToSave.title = title;

        if (dateType === 'specific') {
            if (!startRecur || !endRecur || weeklySelections.every(w => w.length === 0)) {
                alert('Please fill out all fields for the recurrence.');
                return;
            }
            eventToSave.recurrence = {
                startRecur,
                endRecur,
                weeklySelections,
                recurrenceCycle,
            };
            eventToSave.relativeRecurrence = undefined; // Clear relativeRecurrence if switching to specific
        } else if (dateType === 'relative-group') {
            if (!relativeTargetGroupId) {
                alert('Please select a target recurring event.');
                return;
            }
            eventToSave.relativeRecurrence = {
                targetGroupId: relativeTargetGroupId,
                targetType: 'group',
                daysBefore: isDaysBeforeEnabled,
                beforeOffset: daysBefore,
                daysAfter: isDaysAfterEnabled,
                afterOffset: daysAfter,
                dayOf: isDayOfEnabled,
            };
            eventToSave.recurrence = undefined; // Clear recurrence if switching to relative
        } else if (dateType === 'relative-single') {
            if (!relativeTargetId) {
                alert('Please select a target single event or start date.');
                return;
            }
            eventToSave.relativeRecurrence = {
                targetId: relativeTargetId,
                targetType: 'single',
                daysBefore: isDaysBeforeEnabled,
                beforeOffset: daysBefore,
                daysAfter: isDaysAfterEnabled,
                afterOffset: daysAfter,
                dayOf: isDayOfEnabled,
            };
            eventToSave.recurrence = undefined; // Clear recurrence if switching to relative
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
                <label htmlFor="recurring-title">Event Name</label>
                <input type="text" id="recurring-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="recurring-date-type">Date Type</label>
                <select id="recurring-date-type" value={dateType} onChange={(e) => setDateType(e.target.value)}>
                    <option value="specific">Specific Dates</option>
                    <option value="relative-group">Relative to Recurring Event</option>
                    <option value="relative-single">Relative to Single Event</option>
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
            <button onClick={handleSave} className="save-event-button">{editingEvent ? 'Update Recurring Event' : 'Add Recurring Event'}</button>
            {editingEvent && (
                <button onClick={handleCancelEdit} className="cancel-edit-button">Cancel Edit</button>
            )}
        </>
    );
}