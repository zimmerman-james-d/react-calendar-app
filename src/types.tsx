export interface EventDefinition {
  id: string;
  groupId?: string;
  title: string;

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
  
  // For recurring events relative to another recurring series
  relativeRecurrence?: {
    targetGroupId: string; // groupId of the target EventDefinition series
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
