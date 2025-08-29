import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventList, formatRecurrenceRule } from '../src/components/EventList';
import { EventDefinition } from '../src/types';

const dayMap: { [key: number]: string } = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
};

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

describe('formatRecurrenceRule', () => {
  const mockAllDefinitions: EventDefinition[] = [
    { id: 'base-single', title: 'Base Single', date: '2025-01-01' },
    { id: 'base-group', groupId: 'group-abc', title: 'Base Group', recurrence: { startRecur: '2025-01-01', endRecur: '2025-01-07', weeklySelections: [[1]], recurrenceCycle: 1 } },
  ];

  it('should format a recurrence rule correctly', () => {
    const definition: EventDefinition = {
      id: 'rec-1',
      title: 'Weekly Meeting',
      recurrence: {
        startRecur: '2025-10-06',
        endRecur: '2025-10-20',
        weeklySelections: [[1, 3]], // Mondays and Wednesdays
        recurrenceCycle: 1,
      },
    };
    const result = formatRecurrenceRule(definition, []);
    expect(result).toMatchSnapshot();
  });

  it('should format a recurrence rule with recurrenceCycle > 1 correctly', () => {
    const definition: EventDefinition = {
      id: 'rec-2',
      title: 'Bi-weekly Meeting',
      recurrence: {
        startRecur: '2025-10-06',
        endRecur: '2025-10-20',
        weeklySelections: [[1], [3]], // Week 1: Monday, Week 2: Wednesday
        recurrenceCycle: 2,
      },
    };
    const result = formatRecurrenceRule(definition, []);
    expect(result).toMatchSnapshot();
  });

  it('should format a relative recurrence to a group with daysBefore', () => {
    const definition: EventDefinition = {
      id: 'rel-rec-1',
      title: 'Prep Meeting',
      relativeRecurrence: {
        targetGroupId: 'group-abc',
        targetType: 'group',
        daysBefore: true,
        beforeOffset: 2,
        daysAfter: false,
        dayOf: false,
        afterOffset: 0,
      },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('Repeats 2 day(s) before "Base Group"');
  });

  it('should format a relative recurrence to a group with dayOf', () => {
    const definition: EventDefinition = {
      id: 'rel-rec-2',
      title: 'Main Event',
      relativeRecurrence: {
        targetGroupId: 'group-abc',
        targetType: 'group',
        dayOf: true,
        daysBefore: false,
        daysAfter: false,
        beforeOffset: 0,
        afterOffset: 0,
      },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('Repeats the day of "Base Group"');
  });

  it('should format a relative recurrence to a group with daysAfter', () => {
    const definition: EventDefinition = {
      id: 'rel-rec-3',
      title: 'Follow-up',
      relativeRecurrence: {
        targetGroupId: 'group-abc',
        targetType: 'group',
        daysAfter: true,
        afterOffset: 3,
        daysBefore: false,
        dayOf: false,
        beforeOffset: 0,
      },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('Repeats 3 day(s) after "Base Group"');
  });

  it('should format a relative recurrence to a single event (start-date)', () => {
    const definition: EventDefinition = {
      id: 'rel-rec-4',
      title: 'Project Start',
      relativeRecurrence: {
        targetId: 'start-date',
        targetType: 'single',
        dayOf: true,
        daysBefore: false,
        daysAfter: false,
        beforeOffset: 0,
        afterOffset: 0,
      },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('Repeats the day of the Start Date');
  });

  it('should format a relative recurrence to a single event (specific ID)', () => {
    const definition: EventDefinition = {
      id: 'rel-rec-5',
      title: 'Review',
      relativeRecurrence: {
        targetId: 'base-single',
        targetType: 'single',
        daysAfter: true,
        afterOffset: 1,
        daysBefore: false,
        beforeOffset: 0,
        dayOf: false,
      },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('Repeats 1 day(s) after "Base Single"');
  });

  it('should format a relative recurrence with multiple parts', () => {
    const definition: EventDefinition = {
      id: 'rel-rec-6',
      title: 'Complex Relative',
      relativeRecurrence: {
        targetGroupId: 'group-abc',
        targetType: 'group',
        daysBefore: true,
        beforeOffset: 1,
        dayOf: true,
        daysAfter: true,
        afterOffset: 1,
      },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('Repeats 1 day(s) before, the day of, and 1 day(s) after "Base Group"');
  });

  it('should format a relativeTo event (start-date)', () => {
    const definition: EventDefinition = {
      id: 'rel-to-1',
      title: 'Initial Setup',
      relativeTo: { targetId: 'start-date', offset: 0 },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('On the same day as the Start Date');
  });

  it('should format a relativeTo event (specific ID, positive offset)', () => {
    const definition: EventDefinition = {
      id: 'rel-to-2',
      title: 'Follow-up Task',
      relativeTo: { targetId: 'base-single', offset: 7 },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('7 day(s) after "Base Single"');
  });

  it('should format a relativeTo event (specific ID, negative offset)', () => {
    const definition: EventDefinition = {
      id: 'rel-to-3',
      title: 'Pre-meeting Prep',
      relativeTo: { targetId: 'base-single', offset: -2 },
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('2 day(s) before "Base Single"');
  });

  it('should return "Event rule not specified" for unknown rule types', () => {
    const definition: EventDefinition = {
      id: 'unknown-1',
      title: 'Unknown Event',
    };
    const result = formatRecurrenceRule(definition, mockAllDefinitions);
    expect(result).toBe('Event rule not specified');
  });
});
