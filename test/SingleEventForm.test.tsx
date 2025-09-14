import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SingleEventForm } from '../src/components/SingleEventForm';
import { EventInput } from '@fullcalendar/core';
import { EventDefinition } from '../src/types';

// TODO: Add tests for SingleEventForm.tsx:
// - handleAddEvent: Test offset cannot be 0 for relative events.
// - handleAddEvent: Test no target event selected for relative events.
// - handleAddEvent: Test no date selected for specific date events.
describe('SingleEventForm Component', () => {
  const mockOnAddEventDefinition = jest.fn();
  const mockOnUpdateEventDefinition = jest.fn();
  const mockSetEditingEvent = jest.fn();

  const mockEvents: EventInput[] = [
    { id: 'evt-1', title: 'Existing Event', date: '2025-10-15' },
    { id: 'evt-2', title: 'Another Event', date: '2025-10-20' },
  ];

  const renderForm = (props = {}) => {
    const defaultProps = {
      onAddEventDefinition: mockOnAddEventDefinition,
      onUpdateEventDefinition: mockOnUpdateEventDefinition,
      events: mockEvents,
      startDate: '2025-10-01',
      editingEvent: null,
      setEditingEvent: mockSetEditingEvent,
    };
    return render(<SingleEventForm {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    mockOnAddEventDefinition.mockClear();
    mockOnUpdateEventDefinition.mockClear();
    mockSetEditingEvent.mockClear();
  });

  it('should create a specific date event definition', () => {
    renderForm();
    
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Specific Test' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-10-20' } });
    fireEvent.click(screen.getByText('Add Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Specific Test',
        date: '2025-10-20',
      })
    );
  });

  it('should create a relative event definition based on an existing event', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Relative Test' } });
    
    fireEvent.change(screen.getByDisplayValue('Select an event...'), { target: { value: 'evt-1' } });
    
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '5' } });
    fireEvent.change(screen.getByDisplayValue('Days After'), { target: { value: 'before' } });
    
    fireEvent.click(screen.getByText('Add Event'));

    expect(mockOnAddEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Relative Test',
        relativeTo: {
          targetId: 'evt-1',
          offset: -5,
        },
      })
    );
  });

  it('should update an existing specific date event', () => {
    const editingEvent: EventDefinition = {
      id: 'evt-1',
      title: 'Original Specific Event',
      date: '2025-11-01',
    };
    renderForm({ editingEvent });

    // Verify form is pre-populated
    expect(screen.getByLabelText('Event Name')).toHaveValue('Original Specific Event');
    expect(screen.getByLabelText('Date')).toHaveValue('2025-11-01');

    // Make changes
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Updated Specific Event' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-11-05' } });

    fireEvent.click(screen.getByText('Update Event'));

    expect(mockOnUpdateEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt-1',
        title: 'Updated Specific Event',
        date: '2025-11-05',
      })
    );
    expect(mockSetEditingEvent).toHaveBeenCalledWith(null);
  });

  it('should update an existing relative event', () => {
    const editingEvent: EventDefinition = {
      id: 'evt-2',
      title: 'Original Relative Event',
      relativeTo: {
        targetId: 'evt-1',
        offset: -5,
      },
    };
    renderForm({ editingEvent });

    // Verify form is pre-populated
    expect(screen.getByLabelText('Event Name')).toHaveValue('Original Relative Event');
    expect(screen.getByLabelText('Date Type')).toHaveValue('relative');
    expect(screen.getByDisplayValue('Select an event...')).toHaveValue('evt-1');
    expect(screen.getByDisplayValue('5')).toHaveValue(5);
    expect(screen.getByDisplayValue('Days Before')).toHaveValue('before');

    // Make changes
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Updated Relative Event' } });
    fireEvent.change(screen.getByDisplayValue('Select an event...'), { target: { value: 'start-date' } });
    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '10' } });
    fireEvent.change(screen.getByDisplayValue('Days Before'), { target: { value: 'after' } });

    fireEvent.click(screen.getByText('Update Event'));

    expect(mockOnUpdateEventDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt-2',
        title: 'Updated Relative Event',
        relativeTo: {
          targetId: 'start-date',
          offset: 10,
        },
      })
    );
    expect(mockSetEditingEvent).toHaveBeenCalledWith(null);
  });

  it('should clear the form and editing state when Cancel Edit is clicked', () => {
    const editingEvent: EventDefinition = {
      id: 'evt-1',
      title: 'Event to Cancel',
      date: '2025-12-01',
    };
    renderForm({ editingEvent });

    expect(screen.getByLabelText('Event Name')).toHaveValue('Event to Cancel');

    fireEvent.click(screen.getByText('Cancel Edit'));

    expect(screen.getByLabelText('Event Name')).toHaveValue('');
    expect(mockSetEditingEvent).toHaveBeenCalledWith(null);
  });
});
