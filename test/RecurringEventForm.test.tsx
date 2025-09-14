import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecurringEventForm } from '../src/components/RecurringEventForm';
import { EventDefinition } from '../src/types';

// TODO: Add tests to cover error handling branches in RecurringEventForm.tsx
describe('RecurringEventForm Component', () => {
  const mockOnAddEventDefinition = jest.fn();
  const mockOnUpdateEventDefinition = jest.fn();
  const mockSetEditingEvent = jest.fn();

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
    },
    {
      id: 'def-2',
      groupId: 'group-2',
      title: 'Another Recurring Event',
      recurrence: {
        startRecur: '2025-11-01',
        endRecur: '2025-11-30',
        weeklySelections: [[2]], // Tuesdays
        recurrenceCycle: 1,
      },
    },
  ];

  const renderForm = (props = {}) => {
    const defaultProps = {
      onAddEventDefinition: mockOnAddEventDefinition,
      onUpdateEventDefinition: mockOnUpdateEventDefinition,
      eventDefinitions: mockEventDefinitions,
      editingEvent: null,
      setEditingEvent: mockSetEditingEvent,
    };
    return render(<RecurringEventForm {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    mockOnAddEventDefinition.mockClear();
    mockOnUpdateEventDefinition.mockClear();
    mockSetEditingEvent.mockClear();
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

  it('should update an existing specific recurring event', () => {
    const editingEvent: EventDefinition = {
      id: 'def-1',
      groupId: 'group-1',
      title: 'Original Title',
      recurrence: {
        startRecur: '2025-01-01',
        endRecur: '2025-01-31',
        weeklySelections: [[0]], // Sundays
        recurrenceCycle: 1,
      },
    };
    renderForm({ editingEvent });

    // Verify form is pre-populated
    expect(screen.getByLabelText('Event Name')).toHaveValue('Original Title');
    expect(screen.getByLabelText('Start Date')).toHaveValue('2025-01-01');
    expect(screen.getByLabelText('End Date')).toHaveValue('2025-01-31');
    expect(screen.getByText('Sun')).toHaveClass('selected');

    // Make changes
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByText('Mon')); // Add Monday

    fireEvent.click(screen.getByText('Update Recurring Event'));

    expect(mockOnUpdateEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'def-1',
        title: 'Updated Title',
        recurrence: expect.objectContaining({
          weeklySelections: [[0, 1]], // Sunday and Monday
        }),
      })
    );
    expect(mockSetEditingEvent).toHaveBeenCalledWith(null);
  });

  it('should update an existing relative recurring event', () => {
    const editingEvent: EventDefinition = {
      id: 'def-2',
      groupId: 'group-2',
      title: 'Original Relative Title',
      relativeRecurrence: {
        targetGroupId: 'group-1',
        targetType: 'group',
        daysBefore: true,
        beforeOffset: 1,
        daysAfter: false,
        afterOffset: 1,
        dayOf: false,
      },
    };
    renderForm({ editingEvent });

    // Verify form is pre-populated
    expect(screen.getByLabelText('Event Name')).toHaveValue('Original Relative Title');
    expect(screen.getByLabelText('Date Type')).toHaveValue('relative-group');
    expect(screen.getByLabelText('Relative To')).toHaveValue('group-1');
    const daysBeforeGroup = screen.getByLabelText('Days Before').closest('.relative-option-group');
    if (!(daysBeforeGroup instanceof HTMLElement)) throw new Error('Could not find "Days Before" group');
    expect(within(daysBeforeGroup).getByRole('checkbox')).toBeChecked();
    expect(within(daysBeforeGroup).getByRole('spinbutton')).toHaveValue(1);

    // Make changes
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Updated Relative Title' } });
    fireEvent.click(within(daysBeforeGroup).getByRole('checkbox')); // Uncheck days before
    const dayOfGroup = screen.getByLabelText('Day Of').closest('.relative-option-group');
    if (!(dayOfGroup instanceof HTMLElement)) throw new Error('Could not find "Day Of" group');
    fireEvent.click(within(dayOfGroup).getByRole('checkbox')); // Check day of

    fireEvent.click(screen.getByText('Update Recurring Event'));

    expect(mockOnUpdateEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'def-2',
        title: 'Updated Relative Title',
        relativeRecurrence: expect.objectContaining({
          daysBefore: false,
          dayOf: true,
        }),
      })
    );
    expect(mockSetEditingEvent).toHaveBeenCalledWith(null);
  });

  it('should clear the form and editing state when Cancel Edit is clicked', () => {
    const editingEvent: EventDefinition = {
      id: 'def-1',
      groupId: 'group-1',
      title: 'Original Title',
      recurrence: {
        startRecur: '2025-01-01',
        endRecur: '2025-01-31',
        weeklySelections: [[0]], // Sundays
        recurrenceCycle: 1,
      },
    };
    renderForm({ editingEvent });

    expect(screen.getByLabelText('Event Name')).toHaveValue('Original Title');

    fireEvent.click(screen.getByText('Cancel Edit'));

    expect(screen.getByLabelText('Event Name')).toHaveValue('');
    expect(mockSetEditingEvent).toHaveBeenCalledWith(null);
  });
});