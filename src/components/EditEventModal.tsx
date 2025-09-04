import React, { useState, useEffect } from 'react';
import { EventDefinition } from '../types';
import { EventInput } from '@fullcalendar/core';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedDefinition: EventDefinition) => void;
  eventToEdit: EventDefinition | null;
  eventDefinitions: EventDefinition[];
  events: EventInput[];
  startDate: string;
}

const daysOfWeek = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }
];

export function EditEventModal({
  isOpen,
  onClose,
  onUpdate,
  eventToEdit,
  eventDefinitions,
  events,
  startDate,
}: EditEventModalProps) {
  const [title, setTitle] = useState(eventToEdit?.title || '');

  // Specific Date State
  const [specificDate, setSpecificDate] = useState(eventToEdit?.date || '');

  // Recurring Event State
  const [startRecur, setStartRecur] = useState(eventToEdit?.recurrence?.startRecur || '');
  const [endRecur, setEndRecur] = useState(eventToEdit?.recurrence?.endRecur || '');
  const [recurrenceCycle, setRecurrenceCycle] = useState(eventToEdit?.recurrence?.recurrenceCycle || 1);
  const [weeklySelections, setWeeklySelections] = useState<number[][]>(eventToEdit?.recurrence?.weeklySelections || Array.from({ length: 1 }, () => []));

  // Relative Single Event State
  const [relativeOffset, setRelativeOffset] = useState(eventToEdit?.relativeTo?.offset ? Math.abs(eventToEdit.relativeTo.offset) : 1);
  const [relativeDirection, setRelativeDirection] = useState<'after' | 'before' | 'same'>('after');
  const [relativeTargetEventId, setRelativeTargetEventId] = useState(eventToEdit?.relativeTo?.targetId || '');

  // Relative Recurring Event State
  const [isDaysBeforeEnabled, setIsDaysBeforeEnabled] = useState(eventToEdit?.relativeRecurrence?.daysBefore || false);
  const [daysBefore, setDaysBefore] = useState(eventToEdit?.relativeRecurrence?.beforeOffset || 1);
  const [isDaysAfterEnabled, setIsDaysAfterEnabled] = useState(eventToEdit?.relativeRecurrence?.daysAfter || false);
  const [daysAfter, setDaysAfter] = useState(eventToEdit?.relativeRecurrence?.afterOffset || 1);
  const [isDayOfEnabled, setIsDayOfEnabled] = useState(eventToEdit?.relativeRecurrence?.dayOf || false);
  const [relativeTargetGroupId, setRelativeTargetGroupId] = useState(eventToEdit?.relativeRecurrence?.targetGroupId || '');
  const [relativeRecurringTargetId, setRelativeRecurringTargetId] = useState(eventToEdit?.relativeRecurrence?.targetId || '');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      if (eventToEdit.date) {
        setSpecificDate(eventToEdit.date);
      } else if (eventToEdit.recurrence) {
        setStartRecur(eventToEdit.recurrence.startRecur);
        setEndRecur(eventToEdit.recurrence.endRecur);
        setRecurrenceCycle(eventToEdit.recurrence.recurrenceCycle);
        setWeeklySelections(eventToEdit.recurrence.weeklySelections);
      } else if (eventToEdit.relativeTo) {
        setRelativeTargetEventId(eventToEdit.relativeTo.targetId);
        setRelativeOffset(Math.abs(eventToEdit.relativeTo.offset));
        setRelativeDirection(eventToEdit.relativeTo.offset > 0 ? 'after' : (eventToEdit.relativeTo.offset < 0 ? 'before' : 'same'));
      } else if (eventToEdit.relativeRecurrence) {
        setRelativeTargetGroupId(eventToEdit.relativeRecurrence.targetGroupId || '');
        setRelativeRecurringTargetId(eventToEdit.relativeRecurrence.targetId || '');
        setIsDaysBeforeEnabled(eventToEdit.relativeRecurrence.daysBefore);
        setDaysBefore(eventToEdit.relativeRecurrence.beforeOffset);
        setIsDaysAfterEnabled(eventToEdit.relativeRecurrence.daysAfter);
        setDaysAfter(eventToEdit.relativeRecurrence.afterOffset);
        setIsDayOfEnabled(eventToEdit.relativeRecurrence.dayOf);
      }
    }
  }, [eventToEdit]);

  useEffect(() => {
    if (eventToEdit?.recurrence) {
      setWeeklySelections(currentSelections => Array.from({ length: recurrenceCycle }, (_, i) => currentSelections[i] || []));
    }
  }, [recurrenceCycle, eventToEdit]);

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

  const handleUpdate = () => {
    if (!eventToEdit) return;

    const updatedDefinition: EventDefinition = {
      ...eventToEdit,
      title,
    };

    if (eventToEdit.date) {
      if (!specificDate) {
        alert('Please select a specific date.');
        return;
      }
      updatedDefinition.date = specificDate;
    } else if (eventToEdit.recurrence) {
      if (!startRecur || !endRecur || weeklySelections.every(w => w.length === 0)) {
        alert('Please fill out all fields for the recurrence.');
        return;
      }
      updatedDefinition.recurrence = {
        startRecur,
        endRecur,
        weeklySelections,
        recurrenceCycle,
      };
    } else if (eventToEdit.relativeTo) {
      if (!relativeTargetEventId) {
        alert('Please select a target event.');
        return;
      }
      let offset = relativeDirection === 'same' ? 0 : relativeOffset;
      if (relativeDirection === 'before') {
        offset *= -1;
      }
      updatedDefinition.relativeTo = {
        targetId: relativeTargetEventId,
        offset: offset,
      };
    } else if (eventToEdit.relativeRecurrence) {
      if (eventToEdit.relativeRecurrence.targetType === 'group' && !relativeTargetGroupId) {
        alert('Please select a target recurring event.');
        return;
      }
      if (eventToEdit.relativeRecurrence.targetType === 'single' && !relativeRecurringTargetId) {
        alert('Please select a target single event or start date.');
        return;
      }
      updatedDefinition.relativeRecurrence = {
        targetType: eventToEdit.relativeRecurrence.targetType,
        targetGroupId: eventToEdit.relativeRecurrence.targetType === 'group' ? relativeTargetGroupId : undefined,
        targetId: eventToEdit.relativeRecurrence.targetType === 'single' ? relativeRecurringTargetId : undefined,
        daysBefore: isDaysBeforeEnabled,
        beforeOffset: daysBefore,
        daysAfter: isDaysAfterEnabled,
        afterOffset: daysAfter,
        dayOf: isDayOfEnabled,
      };
    }

    onUpdate(updatedDefinition);
    onClose();
  };

  if (!isOpen || !eventToEdit) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Edit Event: {eventToEdit.title}</h4>
        <div className="form-group">
          <label htmlFor="edit-event-title">Event Name</label>
          <input type="text" id="edit-event-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {eventToEdit.date && (
          <div className="form-group">
            <label htmlFor="edit-event-date">Date</label>
            <input type="date" id="edit-event-date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} />
          </div>
        )}

        {eventToEdit.recurrence && (
          <>
            <div className="form-group">
              <label htmlFor="edit-recurrence-cycle">Repeats Every</label>
              <select id="edit-recurrence-cycle" value={recurrenceCycle} onChange={(e) => setRecurrenceCycle(Number(e.target.value))}>
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
              <label htmlFor="edit-start-recur">Start Date</label>
              <input type="date" id="edit-start-recur" value={startRecur} onChange={(e) => setStartRecur(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-end-recur">End Date</label>
              <input type="date" id="edit-end-recur" value={endRecur} onChange={(e) => setEndRecur(e.target.value)} />
            </div>
          </>
        )}

        {eventToEdit.relativeTo && (
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
              {events.filter(def => def.id !== eventToEdit.id).map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} ({event.date?.toString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {eventToEdit.relativeRecurrence && (
          <>
            <div className="form-group">
              <label htmlFor="edit-relative-target">Relative To</label>
              {eventToEdit.relativeRecurrence.targetType === 'group' && (
                <select id="edit-relative-target" className="relative-target-select" value={relativeTargetGroupId} onChange={(e) => setRelativeTargetGroupId(e.target.value)}>
                  <option value="">Select a recurring event...</option>
                  {eventDefinitions.filter(def => def.recurrence && def.groupId !== eventToEdit.groupId).map((def) => (
                    <option key={def.id} value={def.groupId}>
                      {def.title}
                    </option>
                  ))}
                </select>
              )}
              {eventToEdit.relativeRecurrence.targetType === 'single' && (
                <select id="edit-relative-target" className="relative-target-select" value={relativeRecurringTargetId} onChange={(e) => setRelativeRecurringTargetId(e.target.value)}>
                  <option value="">Select a single event or start date...</option>
                  <option value="start-date">Start Date</option>
                  {eventDefinitions.filter(def => def.date && def.id !== eventToEdit.id).map((def) => (
                    <option key={def.id} value={def.id}>
                      {def.title} ({def.date})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="relative-option-group">
              <input type="checkbox" id="edit-days-before-check" checked={isDaysBeforeEnabled} onChange={() => setIsDaysBeforeEnabled(!isDaysBeforeEnabled)} />
              <input type="number" value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))} disabled={!isDaysBeforeEnabled} />
              <label htmlFor="edit-days-before-check">Days Before</label>
            </div>
            <div className="relative-option-group">
              <input type="checkbox" id="edit-days-after-check" checked={isDaysAfterEnabled} onChange={() => setIsDaysAfterEnabled(!isDaysAfterEnabled)} />
              <input type="number" value={daysAfter} onChange={(e) => setDaysAfter(Number(e.target.value))} disabled={!isDaysAfterEnabled} />
              <label htmlFor="edit-days-after-check">Days After</label>
            </div>
            <div className="relative-option-group">
              <input type="checkbox" id="edit-day-of-check" checked={isDayOfEnabled} onChange={() => setIsDayOfEnabled(!isDayOfEnabled)} />
              <label htmlFor="edit-day-of-check">Day Of</label>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="modal-button submit" onClick={handleUpdate}>Update</button>
          <button className="modal-button cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
