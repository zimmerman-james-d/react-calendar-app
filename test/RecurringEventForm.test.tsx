import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecurringEventForm } from '../src/components/RecurringEventForm';
import { EventDefinition } from '../src/types';

// TODO: Add tests to cover error handling branches in RecurringEventForm.tsx (lines 47, 57-58, 69-70, 80-81, 94-95)
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

  it('should correctly create a specific recurring event definition based on day toggles', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Specific Test' } });
    fireEvent.change(screen.getByLabelText('Repeats Every'), { target: { value: '1' } });
    
    // Click Monday and Wednesday
    fireEvent.click(screen.getByText('Mon'));
    fireEvent.click(screen.getByText('Wed'));

    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2025-11-01' } });
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2025-11-30' } });

    fireEvent.click(screen.getByText('Add Recurring Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Specific Test',
        recurrence: expect.objectContaining({
          weeklySelections: [[1, 3]], // Monday and Wednesday
        }),
      })
    );
  });

  it('should create a relative recurring event with "days before" selected', () => {
    renderForm();
    
    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative-group' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Days Before Test' } });
    fireEvent.change(screen.getByLabelText('Relative To'), { target: { value: 'group-1' } });

    const daysBeforeGroup = screen.getByLabelText('Days Before').closest('.relative-option-group');
    if (!(daysBeforeGroup instanceof HTMLElement)) throw new Error('Could not find "Days Before" group');
    fireEvent.click(within(daysBeforeGroup).getByRole('checkbox'));
    fireEvent.change(within(daysBeforeGroup).getByRole('spinbutton'), { target: { value: '3' } });

    fireEvent.click(screen.getByText('Add Recurring Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Days Before Test',
        relativeRecurrence: expect.objectContaining({
          targetGroupId: 'group-1',
          targetType: 'group',
          daysBefore: true,
          beforeOffset: 3,
          daysAfter: false,
          dayOf: false,
        }),
      })
    );
  });

  it('should create a relative recurring event with "day of" selected', () => {
    renderForm();
    
    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative-group' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Day Of Test' } });
    fireEvent.change(screen.getByLabelText('Relative To'), { target: { value: 'group-1' } });

    const dayOfGroup = screen.getByLabelText('Day Of').closest('.relative-option-group');
    if (!(dayOfGroup instanceof HTMLElement)) throw new Error('Could not find "Day Of" group');
    fireEvent.click(within(dayOfGroup).getByRole('checkbox'));

    fireEvent.click(screen.getByText('Add Recurring Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Day Of Test',
        relativeRecurrence: expect.objectContaining({
          targetGroupId: 'group-1',
          targetType: 'group',
          dayOf: true,
          daysBefore: false,
          daysAfter: false,
        }),
      })
    );
  });

  it('should create a relative recurring event with "days after" selected', () => {
    renderForm();
    
    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative-group' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Days After Test' } });
    fireEvent.change(screen.getByLabelText('Relative To'), { target: { value: 'group-1' } });

    const daysAfterGroup = screen.getByLabelText('Days After').closest('.relative-option-group');
    if (!(daysAfterGroup instanceof HTMLElement)) throw new Error('Could not find "Days After" group');
    fireEvent.click(within(daysAfterGroup).getByRole('checkbox'));
    fireEvent.change(within(daysAfterGroup).getByRole('spinbutton'), { target: { value: '5' } });

    fireEvent.click(screen.getByText('Add Recurring Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Days After Test',
        relativeRecurrence: expect.objectContaining({
          targetGroupId: 'group-1',
          targetType: 'group',
          daysAfter: true,
          afterOffset: 5,
          daysBefore: false,
          dayOf: false,
        }),
      })
    );
  });

  it('should create a relative recurring event relative to a single event', () => {
    const singleEvent: EventDefinition = { id: 'single-1', title: 'Single Event', date: '2025-11-15' };
    renderForm({ eventDefinitions: [...mockEventDefinitions, singleEvent] });

    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative-single' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Relative to Single Test' } });
    fireEvent.change(screen.getByLabelText('Relative To'), { target: { value: 'single-1' } });

    const daysBeforeGroup = screen.getByLabelText('Days Before').closest('.relative-option-group');
    if (!(daysBeforeGroup instanceof HTMLElement)) throw new Error('Could not find "Days Before" group');
    fireEvent.click(within(daysBeforeGroup).getByRole('checkbox'));
    fireEvent.change(within(daysBeforeGroup).getByRole('spinbutton'), { target: { value: '2' } });

    fireEvent.click(screen.getByText('Add Recurring Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Relative to Single Test',
        relativeRecurrence: expect.objectContaining({
          targetId: 'single-1',
          targetType: 'single',
          daysBefore: true,
          beforeOffset: 2,
          daysAfter: false,
          dayOf: false,
        }),
      })
    );
  });

  it('should create a relative recurring event relative to the start date', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative-single' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Relative to Start Date Test' } });
    fireEvent.change(screen.getByLabelText('Relative To'), { target: { value: 'start-date' } });

    const daysAfterGroup = screen.getByLabelText('Days After').closest('.relative-option-group');
    if (!(daysAfterGroup instanceof HTMLElement)) throw new Error('Could not find "Days After" group');
    fireEvent.click(within(daysAfterGroup).getByRole('checkbox'));
    fireEvent.change(within(daysAfterGroup).getByRole('spinbutton'), { target: { value: '10' } });

    fireEvent.click(screen.getByText('Add Recurring Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Relative to Start Date Test',
        relativeRecurrence: expect.objectContaining({
          targetId: 'start-date',
          targetType: 'single',
          daysAfter: true,
          afterOffset: 10,
          daysBefore: false,
          dayOf: false,
        }),
      })
    );
  });
});
