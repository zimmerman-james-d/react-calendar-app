import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { RebaseStartDateModal } from '../src/components/RebaseStartDateModal';
import { useEventGenerator } from '../src/utils/eventUtils';
import { EventDefinition } from '../src/types';

const START = '2026-08-17';

const defs: EventDefinition[] = [
  { id: 'block1', title: 'Block 1 Nelarabine', recurrence: {
      weeklySelections: [[1]], recurrenceCycle: 1,
      relativeToStartDate: { startOffset: 0, endOffset: 6 } } },
  { id: 'block2', title: 'Block 2 Nelarabine', recurrence: {
      weeklySelections: [[1]], recurrenceCycle: 1,
      relativeToStartDate: { startOffset: 42, endOffset: 48 } } },
  { id: 'school', title: 'School re-entry', date: '2026-10-05' },
];

function setup(onApply = jest.fn()) {
  const events = renderHook(() => useEventGenerator(defs, START)).result.current;
  render(
    <RebaseStartDateModal
      isOpen={true}
      startDate={START}
      eventDefinitions={defs}
      events={events}
      onCancel={jest.fn()}
      onApply={onApply}
    />
  );
  return { onApply };
}

const pickDay = (value: string) =>
  fireEvent.change(screen.getByLabelText('New day 1'), { target: { value } });

const switchToDate = () =>
  fireEvent.click(screen.getByRole('radio', { name: 'Date' }));

const pickDate = (value: string) =>
  fireEvent.change(screen.getByLabelText('New day 1'), { target: { value } });

describe('RebaseStartDateModal', () => {
  it('asks for a day number by default', () => {
    setup();
    expect(screen.getByRole('radio', { name: 'Day number' })).toBeChecked();
    expect(screen.getByLabelText('New day 1')).toHaveAttribute('type', 'number');
  });

  it('shows nothing to confirm until a day is picked', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Set New Day 1' })).toBeDisabled();
  });

  it('resolves a day number to the date it falls on', () => {
    setup();
    pickDay('43');
    expect(screen.getByText(/Day 43/)).toBeInTheDocument();
    expect(screen.getByText('2026-09-28')).toBeInTheDocument();
  });

  it('reports the day number when a date is picked instead', () => {
    setup();
    switchToDate();
    pickDate('2026-09-28');
    expect(screen.getByText(/Day 43/)).toBeInTheDocument();
  });

  it('lists what will be dropped', () => {
    setup();
    pickDay('43');
    expect(screen.getByText(/1 event will be dropped/)).toBeInTheDocument();
    expect(screen.getByText('Block 1 Nelarabine')).toBeInTheDocument();
  });

  it('warns about fixed-date events that will not shift', () => {
    setup();
    pickDay('43');
    expect(screen.getByText(/set\s+to fixed dates and will not shift/)).toBeInTheDocument();
    expect(screen.getByText(/School re-entry/)).toBeInTheDocument();
  });

  // The fixture's last event is the fixed-date 2026-10-05, which is day 50.
  const MAX_DAY = 50;

  it.each([
    ['below 1', '0'],
    ['negative', '-5'],
    ['fractional', '1.5'],
    ['one past the last scheduled day', String(MAX_DAY + 1)],
    ['far past the last scheduled day', '99999'],
    ['large enough to push Date out of range', '100000000'],
    ['in exponent form', '1e12'],
  ])('rejects a day number %s the same way, without crashing', (_label, value) => {
    setup();
    expect(() => pickDay(value)).not.toThrow();

    expect(screen.getByText(/Enter a whole day number between 1 and 50/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set New Day 1' })).toBeDisabled();
    // No resolved date is shown for a day the schedule never reaches.
    expect(screen.queryByText(/falls on/)).not.toBeInTheDocument();
  });

  it('shows no error for input a number field will not accept', () => {
    setup();
    expect(() => pickDay('abc')).not.toThrow();
    expect(screen.getByRole('button', { name: 'Set New Day 1' })).toBeDisabled();
  });

  it('accepts the last scheduled day', () => {
    setup();
    pickDay(String(MAX_DAY));
    expect(screen.queryByText(/Enter a whole day number/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set New Day 1' })).toBeEnabled();
    expect(screen.getByText(/falls on/)).toBeInTheDocument();
  });

  it('caps the day input at the last scheduled day', () => {
    setup();
    expect(screen.getByLabelText('New day 1')).toHaveAttribute('max', String(MAX_DAY));
  });

  it('rejects a date past the last scheduled day', () => {
    setup();
    switchToDate();
    pickDate('2026-12-01');
    expect(screen.getByText(/Pick a date between/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set New Day 1' })).toBeDisabled();
  });

  it('rejects a date before the current start date', () => {
    setup();
    switchToDate();
    pickDate('2026-08-01');
    expect(screen.getByText(/Pick a date between/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set New Day 1' })).toBeDisabled();
  });

  it('carries the chosen day across a switch to dates and back', () => {
    setup();
    pickDay('43');
    switchToDate();
    expect(screen.getByLabelText('New day 1')).toHaveValue('2026-09-28');

    fireEvent.click(screen.getByRole('radio', { name: 'Day number' }));
    expect(screen.getByLabelText('New day 1')).toHaveValue(43);
  });

  it('hands back the chosen day and the rebased definitions', () => {
    const { onApply } = setup();
    pickDay('43');
    fireEvent.click(screen.getByRole('button', { name: 'Set New Day 1' }));

    expect(onApply).toHaveBeenCalledTimes(1);
    const [newStartDate, definitions] = onApply.mock.calls[0];
    expect(newStartDate).toBe('2026-09-28');
    expect(definitions[0].deleted).toBe(true);
    expect(definitions[1].recurrence.relativeToStartDate).toEqual({ startOffset: 0, endOffset: 6 });
  });
});
