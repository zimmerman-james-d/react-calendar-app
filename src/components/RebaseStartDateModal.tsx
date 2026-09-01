import React, { useMemo, useState } from 'react';
import { EventInput } from '@fullcalendar/core';
import { EventDefinition } from '../types';
import {
    planRebase, dayNumber, dateFromDayNumber, lastScheduledDay,
} from '../utils/rebaseStartDate';

interface RebaseStartDateModalProps {
    isOpen: boolean;
    startDate: string;
    eventDefinitions: EventDefinition[];
    events: EventInput[];
    onCancel: () => void;
    onApply: (newStartDate: string, definitions: EventDefinition[]) => void;
}

type CutMode = 'day' | 'date';

const MAX_LISTED = 8;

export function RebaseStartDateModal({
    isOpen,
    startDate,
    eventDefinitions,
    events,
    onCancel,
    onApply,
}: RebaseStartDateModalProps) {
    // Protocols are written in day numbers, so that is the way in by default;
    // the calendar date is there for when someone is working from a date.
    const [mode, setMode] = useState<CutMode>('day');
    const [dayText, setDayText] = useState('');
    const [dateText, setDateText] = useState('');

    // Moving day 1 past the last scheduled event would drop the whole calendar,
    // so that day is the ceiling. It also keeps the arithmetic below well inside
    // the range where a Date can be turned back into a string.
    const maxDay = useMemo(
        () => lastScheduledDay(startDate, events.map(e => e.date?.toString() ?? '')),
        [startDate, events]
    );

    const day = Number(dayText);
    const isDayValid = dayText.trim() !== '' && Number.isInteger(day) && day >= 1 && day <= maxDay;
    const isDateValid = Boolean(dateText) && dateText >= startDate
        && dateText <= dateFromDayNumber(startDate, maxDay);

    const cutDate = useMemo(() => {
        if (!startDate) return '';
        if (mode === 'day') return isDayValid ? dateFromDayNumber(startDate, day) : '';
        return isDateValid ? dateText : '';
    }, [mode, startDate, isDayValid, day, isDateValid, dateText]);

    const plan = useMemo(
        () => (cutDate ? planRebase(eventDefinitions, startDate, cutDate, events) : null),
        [cutDate, eventDefinitions, startDate, events]
    );

    // Carry the chosen day across so switching how it is entered never loses it.
    const switchMode = (next: CutMode) => {
        if (next === mode) return;
        if (next === 'date') {
            setDateText(cutDate);
        } else {
            setDayText(cutDate ? String(dayNumber(startDate, cutDate)) : '');
        }
        setMode(next);
    };

    if (!isOpen) return null;

    const showDayError = mode === 'day' && dayText.trim() !== '' && !isDayValid;
    const showDateError = mode === 'date' && Boolean(dateText) && !isDateValid;

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-content--wide">
                <h4>Make a Later Day the New Day 1</h4>
                <p className="rebase-intro">
                    Everything before the day you pick is dropped, and that day is renumbered as day 1.
                    Nothing moves on the calendar yet &mdash; once this is applied, change the Start Date
                    to push the remaining schedule out by the length of the delay.
                </p>

                <fieldset className="rebase-mode">
                    <legend>Enter it as a</legend>
                    <label>
                        <input
                            type="radio"
                            name="rebase-mode"
                            value="day"
                            checked={mode === 'day'}
                            onChange={() => switchMode('day')}
                        />
                        Day number
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="rebase-mode"
                            value="date"
                            checked={mode === 'date'}
                            onChange={() => switchMode('date')}
                        />
                        Date
                    </label>
                </fieldset>

                {mode === 'day' ? (
                    <div className="form-group">
                        <label htmlFor="rebase-cut-day">New day 1</label>
                        <input
                            type="number"
                            id="rebase-cut-day"
                            min={1}
                            max={maxDay}
                            value={dayText}
                            onChange={(e) => setDayText(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <label htmlFor="rebase-cut-date">New day 1</label>
                        <input
                            type="date"
                            id="rebase-cut-date"
                            value={dateText}
                            min={startDate}
                            max={startDate ? dateFromDayNumber(startDate, maxDay) : undefined}
                            onChange={(e) => setDateText(e.target.value)}
                        />
                    </div>
                )}

                {showDayError && (
                    <p className="rebase-error">
                        Enter a whole day number between 1 and {maxDay.toLocaleString()} &mdash; the
                        schedule&rsquo;s last day.
                    </p>
                )}
                {showDateError && (
                    <p className="rebase-error">
                        Pick a date between the current start date ({startDate || 'not set'}) and{' '}
                        {dateFromDayNumber(startDate, maxDay)}, the schedule&rsquo;s last day.
                    </p>
                )}

                {plan && (
                    <div className="rebase-summary">
                        <p>
                            <strong>Day {plan.cutDayNumber}</strong> falls on <strong>{cutDate}</strong>.
                            It becomes day 1, and the schedule shortens by {plan.shiftDays} day
                            {plan.shiftDays === 1 ? '' : 's'}.
                        </p>

                        <p>
                            {plan.droppedTitles.length === 0
                                ? 'No events fall entirely before this day, so nothing will be dropped.'
                                : `${plan.droppedTitles.length} event${plan.droppedTitles.length === 1 ? '' : 's'} will be dropped:`}
                        </p>
                        {plan.droppedTitles.length > 0 && (
                            <ul className="rebase-list">
                                {plan.droppedTitles.slice(0, MAX_LISTED).map((title, i) => (
                                    <li key={i}>{title}</li>
                                ))}
                                {plan.droppedTitles.length > MAX_LISTED && (
                                    <li className="rebase-list-more">
                                        &hellip; and {plan.droppedTitles.length - MAX_LISTED} more
                                    </li>
                                )}
                            </ul>
                        )}
                        {plan.splits.length > 0 && (
                            <>
                                <p>
                                    {plan.splits.length} repeating event
                                    {plan.splits.length === 1 ? ' runs' : 's run'} across this day. Only the
                                    dates before it are dropped:
                                </p>
                                <ul className="rebase-list">
                                    {plan.splits.slice(0, MAX_LISTED).map(item => (
                                        <li key={item.id}>
                                            {item.title} &mdash; {item.dropped} date
                                            {item.dropped === 1 ? '' : 's'} dropped, {item.kept} kept
                                        </li>
                                    ))}
                                    {plan.splits.length > MAX_LISTED && (
                                        <li className="rebase-list-more">
                                            &hellip; and {plan.splits.length - MAX_LISTED} more
                                        </li>
                                    )}
                                </ul>
                            </>
                        )}
                        <p className="rebase-note">
                            Dropped events keep the dates they actually fell on and move to the deleted
                            list, so they can be restored from &ldquo;All Events&rdquo; if you pick the
                            wrong day, and they stay put when you change the Start Date afterwards.
                        </p>

                        {plan.pinned.length > 0 && (
                            <div className="rebase-warning">
                                <p>
                                    <strong>
                                        {plan.pinned.length} event{plan.pinned.length === 1 ? ' is' : 's are'} set
                                        to fixed dates and will not shift
                                    </strong>{' '}
                                    when you change the Start Date afterwards. Review these by hand:
                                </p>
                                <ul className="rebase-list">
                                    {plan.pinned.slice(0, MAX_LISTED).map(item => (
                                        <li key={item.id}>
                                            {item.title}
                                            {item.dates.length > 0 && ` — ${item.dates[0]}`}
                                            {item.dates.length > 1 && ` (+${item.dates.length - 1} more)`}
                                        </li>
                                    ))}
                                    {plan.pinned.length > MAX_LISTED && (
                                        <li className="rebase-list-more">
                                            &hellip; and {plan.pinned.length - MAX_LISTED} more
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="modal-actions">
                    <button
                        className="modal-button submit"
                        disabled={!plan}
                        onClick={() => plan && onApply(cutDate, plan.definitions)}
                    >
                        Set New Day 1
                    </button>
                    <button className="modal-button cancel" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
