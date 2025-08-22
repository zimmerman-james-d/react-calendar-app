import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SingleEventForm } from '../src/components/SingleEventForm';
import { EventInput } from '@fullcalendar/core';

describe('SingleEventForm Component', () => {
  const mockOnAddEvent = jest.fn();
  const mockEvents: EventInput[] = [
    { title: 'Existing Event', date: '2025-10-15' }
  ];

  const renderForm = (props = {}) => {
    const defaultProps = {
      onAddEvent: mockOnAddEvent,
      events: mockEvents,
      startDate: '2025-10-01',
    };
    return render(<SingleEventForm {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    mockOnAddEvent.mockClear();
  });

  it('should create a single event with a specific date', () => {
    renderForm();
    
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Specific Date Event' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-10-20' } });
    fireEvent.click(screen.getByText('Add Event'));

    expect(mockOnAddEvent).toHaveBeenCalledWith({
      title: 'Specific Date Event',
      date: '2025-10-20',
    });
  });

  it('should create a relative event after the main start date', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Date Type'), { target: { value: 'relative' } });
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Relative After Start' } });
    
    fireEvent.change(screen.getByDisplayValue('Select an event...'), { target: { value: 'start-date' } });
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '10' } });
    fireEvent.change(screen.getByDisplayValue('Days After'), { target: { value: 'after' } });
    
    fireEvent.click(screen.getByText('Add Event'));

    expect(mockOnAddEvent).toHaveBeenCalledWith({
      title: 'Relative After Start',
      date: '2025-10-11',
    });
  });
});
