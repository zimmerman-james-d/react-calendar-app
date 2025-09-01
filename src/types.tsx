export interface EventDefinition {
  id: string;
  groupId?: string;
  title: string;
  deleted?: boolean;

  // --- Date Definition ---
  // For single, specific date events
  date?: string; 

  // For recurring events with specific weekly patterns
  recurrence?: {
    startRecur: string;
    endRecur: string;
    weeklySelections: number[][];
    recurrenceCycle: number;
  };

  // For events relative to another single event
  relativeTo?: {
    targetId: string; // ID of the target EventDefinition or "start-date"
    offset: number;   // Can be positive or negative
  };
  
  // For recurring events relative to another recurring series OR single event
  relativeRecurrence?: {
    targetId?: string; // ID of the target EventDefinition (single event or "start-date")
    targetGroupId?: string; // groupId of the target EventDefinition series
    targetType: 'single' | 'group'; // New field to differentiate
    daysBefore: boolean;
    daysAfter: boolean;
    dayOf: boolean;
    beforeOffset: number;
    afterOffset: number;
  };

  // --- Exceptions ---
  // Stores modifications to specific instances of a recurring event
  exceptions?: Record<string, string>; 
}
