import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventList } from '../src/components/EventList';
import { EventDefinition } from '../src/types';

describe('EventList Component', () => {
  const mockOnDeleteEventDefinition = jest.fn();
  const mockOnRestoreEventDefinition = jest.fn();

  const mockEventDefinitions: EventDefinition[] = [
    { id: '1', title: 'Test Event 1', date: '2025-10-20', deleted: false },
    { id: '2', title: 'Test Event 2', date: '2025-10-21', deleted: true },
  ];

  beforeEach(() => {
    mockOnDeleteEventDefinition.mockClear();
    mockOnRestoreEventDefinition.mockClear();
  });

  it('should render active event definitions and call onDeleteEventDefinition when delete button is clicked', () => {
    render(
      <EventList 
        eventDefinitions={mockEventDefinitions} 
        onDeleteEventDefinition={mockOnDeleteEventDefinition} 
        onRestoreEventDefinition={mockOnRestoreEventDefinition}
      />
    );

    const listItems = screen.getAllByRole('listitem');
    const activeListItems = listItems.filter(item => !item.classList.contains('deleted-event'));
    const deletedListItems = listItems.filter(item => item.classList.contains('deleted-event'));

    expect(activeListItems.length).toBe(1);
    expect(activeListItems[0]).toHaveTextContent('Test Event 1');

    expect(deletedListItems.length).toBe(1);
    expect(deletedListItems[0]).toHaveTextContent('Test Event 2');
    expect(deletedListItems[0]).toHaveClass('deleted-event');

    // Find the delete button for Test Event 1 and click it
    const deleteButtons = activeListItems[0].querySelector('.delete-event-button');
    if (deleteButtons) {
      fireEvent.click(deleteButtons);
    }

    // Assert that onDeleteEventDefinition was called with the correct ID
    expect(mockOnDeleteEventDefinition).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteEventDefinition).toHaveBeenCalledWith('1');
  });

  it('should render deleted event definitions and call onRestoreEventDefinition when restore button is clicked', () => {
    render(
      <EventList 
        eventDefinitions={mockEventDefinitions} 
        onDeleteEventDefinition={mockOnDeleteEventDefinition} 
        onRestoreEventDefinition={mockOnRestoreEventDefinition}
      />
    );

    // Check if deleted events section and event are rendered
    expect(screen.getByText('Deleted Events')).toBeInTheDocument();
    const deletedEventTextElement = screen.getByText('Test Event 2');
    const deletedEventListItem = deletedEventTextElement.closest('li');
    expect(deletedEventListItem).toBeInTheDocument();
    expect(deletedEventListItem).toHaveClass('deleted-event');

    // Find the restore button for Test Event 2 and click it
    const restoreButton = screen.getByText('Restore');
    fireEvent.click(restoreButton);

    // Assert that onRestoreEventDefinition was called with the correct ID
    expect(mockOnRestoreEventDefinition).toHaveBeenCalledTimes(1);
    expect(mockOnRestoreEventDefinition).toHaveBeenCalledWith('2');
  });
});
