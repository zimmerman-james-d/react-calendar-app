import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecurringEventForm } from '../src/components/RecurringEventForm';
import { EventInput } from '@fullcalendar/core';

describe('RecurringEventForm Component', () => {
  const mockOnAddEvent = jest.fn();
  const mockEvents: EventInput[] = [
    { title: 'Existing Event', date: '2025-10-20' }
  ];

  const renderForm = (props = {}) => {
    const defaultProps = {
      onAddEvent: mockOnAddEvent,
      events: mockEvents,
      startDate: '2025-10-01',
    };
    return render(<RecurringEventForm {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    mockOnAddEvent.mockClear();
  });

  it('should create relative events for all three enabled options', () => {
    renderForm();

    // Switch to relative date type
    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Test Relative' } });

    // Select the target event
    const targetEventKey = `${mockEvents[0].title}-${mockEvents[0].date}`;
    fireEvent.change(screen.getByLabelText('Relative To'), { target: { value: targetEventKey } });

    // Enable and configure "Days Before"
    const daysBeforeGroup = screen.getByLabelText('Days Before').closest('.relative-option-group');
    if (!(daysBeforeGroup instanceof HTMLElement)) throw new Error('Could not find "Days Before" group');
    fireEvent.click(within(daysBeforeGroup).getByRole('checkbox'));
    fireEvent.change(within(daysBeforeGroup).getByRole('spinbutton'), { target: { value: '5' } });

    // Enable and configure "Days After"
    const daysAfterGroup = screen.getByLabelText('Days After').closest('.relative-option-group');
    if (!(daysAfterGroup instanceof HTMLElement)) throw new Error('Could not find "Days After" group');
    fireEvent.click(within(daysAfterGroup).getByRole('checkbox'));
    fireEvent.change(within(daysAfterGroup).getByRole('spinbutton'), { target: { value: '10' } });

    // Enable "Day Of"
    const dayOfGroup = screen.getByLabelText('Day Of').closest('.relative-option-group');
    if (!(dayOfGroup instanceof HTMLElement)) throw new Error('Could not find "Day Of" group');
    fireEvent.click(within(dayOfGroup).getByRole('checkbox'));

    // Save the event
    fireEvent.click(screen.getByText('Add Recurring Event'));

    // Check that the correct events were created
    // The order might vary depending on implementation, so we check the contents without order sensitivity.
    expect(mockOnAddEvent).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Test Relative', date: '2025-10-15' }), // 20 - 5
        expect.objectContaining({ title: 'Test Relative', date: '2025-10-30' }), // 20 + 10
        expect.objectContaining({ title: 'Test Relative', date: '2025-10-20' })  // Day Of
      ])
    );
    expect(mockOnAddEvent.mock.calls[0][0].length).toBe(3);
  });
});
