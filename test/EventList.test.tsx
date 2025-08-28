import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventList } from '../src/components/EventList';
import { EventDefinition } from '../src/types';

describe('EventList Component', () => {
  const mockOnDeleteEventDefinition = jest.fn();

  const mockEventDefinitions: EventDefinition[] = [
    { id: '1', title: 'Test Event 1', date: '2025-10-20' },
    { id: '2', title: 'Test Event 2', date: '2025-10-21' },
  ];

  beforeEach(() => {
    mockOnDeleteEventDefinition.mockClear();
  });

  it('should render event definitions and call onDeleteEventDefinition when delete button is clicked', () => {
    render(
      <EventList 
        eventDefinitions={mockEventDefinitions} 
        onDeleteEventDefinition={mockOnDeleteEventDefinition} 
      />
    );

    // Check if events are rendered
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();

    // Find the delete button for Test Event 1 and click it
    const deleteButtons = screen.getAllByText('Del');
    fireEvent.click(deleteButtons[0]); // Click the first delete button

    // Assert that onDeleteEventDefinition was called with the correct ID
    expect(mockOnDeleteEventDefinition).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteEventDefinition).toHaveBeenCalledWith('1');
  });
});
