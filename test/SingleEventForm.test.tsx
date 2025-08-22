import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SingleEventForm } from '../src/components/SingleEventForm';
import { EventInput } from '@fullcalendar/core';

describe('SingleEventForm Component', () => {
  const mockOnAddEventDefinition = jest.fn();
  // The events passed in now need an ID to be selectable
  const mockEvents: EventInput[] = [
    { id: 'evt-1', title: 'Existing Event', date: '2025-10-15' }
  ];

  const renderForm = (props = {}) => {
    const defaultProps = {
      onAddEventDefinition: mockOnAddEventDefinition,
      events: mockEvents,
      startDate: '2025-10-01',
    };
    return render(<SingleEventForm {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    mockOnAddEventDefinition.mockClear();
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
    
    // Select the existing event from the dropdown
    fireEvent.change(screen.getByDisplayValue('Select an event...'), { target: { value: 'evt-1' } });
    
    // Set offset to 5 days before
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
});
