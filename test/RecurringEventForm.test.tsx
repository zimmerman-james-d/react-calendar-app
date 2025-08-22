import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecurringEventForm } from '../src/components/RecurringEventForm';
import { EventDefinition } from '../src/types';

describe('RecurringEventForm Component', () => {
  const mockOnAddEventDefinition = jest.fn();
  const mockEventDefinitions: EventDefinition[] = [
    {
      id: 'def-1',
      groupId: 'group-1',
      title: 'Base Recurring Event',
      recurrence: {
        startRecur: '2025-10-01',
        endRecur: '2025-10-31',
        weeklySelections: [[1]], // Mondays
        recurrenceCycle: 1,
      },
    }
  ];

  const renderForm = (props = {}) => {
    const defaultProps = {
      onAddEventDefinition: mockOnAddEventDefinition,
      eventDefinitions: mockEventDefinitions,
    };
    return render(<RecurringEventForm {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    mockOnAddEventDefinition.mockClear();
  });

  it('should create a relative recurring event definition', () => {
    renderForm();
    
    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Relative Follow-up' } });

    // Select the target recurring event series from the dropdown
    fireEvent.change(screen.getByLabelText('Relative To'), { target: { value: 'group-1' } });

    // Enable and configure "Days After"
    const daysAfterGroup = screen.getByLabelText('Days After').closest('.relative-option-group');
    if (!(daysAfterGroup instanceof HTMLElement)) throw new Error('Could not find "Days After" group');
    fireEvent.click(within(daysAfterGroup).getByRole('checkbox'));
    fireEvent.change(within(daysAfterGroup).getByRole('spinbutton'), { target: { value: '2' } });

    fireEvent.click(screen.getByText('Add Recurring Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Relative Follow-up',
        relativeRecurrence: {
          targetGroupId: 'group-1',
          daysBefore: false,
          beforeOffset: 1,
          daysAfter: true,
          afterOffset: 2,
          dayOf: false,
        },
      })
    );
  });
});
