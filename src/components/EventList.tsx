import React from 'react';
import { EventDefinition } from '../types';

interface EventListProps {
  eventDefinitions: EventDefinition[];
}

const dayMap: { [key: number]: string } = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
};

// Helper function to format the recurrence rule into a readable string
function formatRecurrenceRule(definition: EventDefinition, allDefinitions: EventDefinition[]): React.ReactNode {
  if (definition.recurrence) {
    const { startRecur, endRecur, weeklySelections, recurrenceCycle } = definition.recurrence;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{startRecur} - {endRecur}</span>
          <span style={{ textAlign: 'right' }}>{recurrenceCycle} Week{recurrenceCycle > 1 ? 's' : ''}</span>
        </div>
        {weeklySelections.map((days, index) => {
          const dayNames = days.map(d => dayMap[d]).join(', ');
          return <div key={index}>Week {index + 1}: {dayNames}</div>;
        })}
      </div>
    );
  }
  if (definition.relativeRecurrence) {
    let targetTitle = "";
    if (definition.relativeRecurrence.targetType === 'group') {
        const targetDef = allDefinitions.find(d => d.groupId === definition.relativeRecurrence?.targetGroupId);
        targetTitle = targetDef ? `"${targetDef.title}"` : "another series";
    } else if (definition.relativeRecurrence.targetType === 'single') {
        if (definition.relativeRecurrence.targetId === 'start-date') {
            targetTitle = "the Start Date";
        } else {
            const targetDef = allDefinitions.find(d => d.id === definition.relativeRecurrence?.targetId);
            targetTitle = targetDef ? `"${targetDef.title}"` : "another event";
        }
    }
    
    const parts: string[] = [];
    if (definition.relativeRecurrence.daysBefore) {
        parts.push(`${definition.relativeRecurrence.beforeOffset} day(s) before`);
    }
    if (definition.relativeRecurrence.dayOf) {
        parts.push('the day of');
    }
    if (definition.relativeRecurrence.daysAfter) {
        parts.push(`${definition.relativeRecurrence.afterOffset} day(s) after`);
    }

    let detailString = '';
    if (parts.length === 1) {
        detailString = parts[0];
    } else if (parts.length === 2) {
        detailString = parts.join(' and ');
    } else if (parts.length > 2) {
        detailString = `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
    }

    return `Repeats ${detailString} ${targetTitle}`;
  }
  if (definition.relativeTo) {
    const { targetId, offset } = definition.relativeTo;
    let targetTitle = "another event";
    if (targetId === 'start-date') {
      targetTitle = "the Start Date";
    } else {
      const targetDef = allDefinitions.find(d => d.id === targetId);
      if (targetDef) {
        targetTitle = `"${targetDef.title}"`;
      }
    }

    if (offset === 0) {
      return `On the same day as ${targetTitle}`;
    }
    const direction = offset > 0 ? 'after' : 'before';
    return `${Math.abs(offset)} day(s) ${direction} ${targetTitle}`;
  }
  return 'Event rule not specified';
}

export function EventList({ eventDefinitions }: EventListProps) {
  return (
    <ul className="event-list">
      {eventDefinitions.map((def) => (
        <li key={def.id} className="event-list-item">
          <strong>{def.title}</strong>
          <br />
          <small>
            {def.date ? def.date : formatRecurrenceRule(def, eventDefinitions)}
          </small>
        </li>
      ))}
    </ul>
  );
}
