import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Sidebar } from './Sidebar';
import { EventDefinition } from './types';
import { useEventGenerator } from './utils/eventUtils';
import { ConfirmationModal } from './components/ConfirmationModal'; // Import the new modal

export function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [calendarName, setCalendarName] = useState<string>('');
  const calendarRef = useRef<FullCalendar>(null);
  const [editingEvent, setEditingEvent] = useState<EventDefinition | null>(null);

  const handleEditEventDefinition = (event: EventDefinition) => {
    setEditingEvent(event);
  };

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [dependentEventsQueue, setDependentEventsQueue] = useState<EventDefinition[]>([]);
  const [currentParentEventId, setCurrentParentEventId] = useState<string | null>(null);

  const calendarEvents = useEventGenerator(eventDefinitions, startDate);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const handleAddEventDefinition = (newDefinition: EventDefinition) => {
    setEventDefinitions(prev => [...prev, newDefinition]);
  };

  const handleDeleteEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const deletedEvent = prev.find(def => def.id === id);
      const deletedEventGroupId = deletedEvent?.groupId;

      return prev.map(def => {
        if (def.id === id) {
          return { ...def, deleted: true };
        }
        if (def.relativeTo?.targetId === id ||
            (deletedEvent?.recurrence && def.relativeTo?.targetId?.startsWith(id + '-')) ||
            def.relativeRecurrence?.targetId === id ||
            (deletedEventGroupId && def.relativeRecurrence?.targetGroupId === deletedEventGroupId)) {
          return { ...def, deleted: true };
        }
        return def;
      });
    });
  };

  const handlePermanentDeleteEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const eventToDelete = prev.find(def => def.id === id);
      const eventToDeleteGroupId = eventToDelete?.groupId;

      // Identify all dependent events
      const dependents = prev.filter(def => {
        if (def.id === id) return false; // Don't include the event itself
        return def.relativeTo?.targetId === id ||
               (eventToDelete?.recurrence && def.relativeTo?.targetId?.startsWith(id + '-')) ||
               def.relativeRecurrence?.targetId === id ||
               (eventToDeleteGroupId && def.relativeRecurrence?.targetGroupId === eventToDeleteGroupId);
      });

      if (dependents.length > 0) {
        // If there are dependents, start the confirmation process
        setDependentEventsQueue(dependents);
        setCurrentParentEventId(id); // Store the ID of the event that initiated the deletion
        setIsConfirmModalOpen(true); // Open the modal for the first dependent
        setConfirmModalMessage(`The event "${eventToDelete?.title}" has dependent events. Do you want to permanently delete its dependent event: "${dependents[0].title}"?`);
        return prev; // Return current state, deletion will happen via modal callbacks
      } else {
        // No dependents, proceed with direct permanent deletion of the event itself
        return prev.filter(def => def.id !== id);
      }
    });
  };

  const handleConfirmDependentDelete = () => {
    setEventDefinitions(prev => {
      const [nextDependent, ...remainingDependents] = dependentEventsQueue;

      // Permanently delete the current dependent event
      const updatedDefs = prev.filter(def => def.id !== nextDependent.id);

      if (remainingDependents.length > 0) {
        // If there are more dependents, update the queue and show modal for next
        setDependentEventsQueue(remainingDependents);
        setConfirmModalMessage(`Do you want to permanently delete its dependent event: "${remainingDependents[0].title}"?`);
        return updatedDefs;
      } else {
        // All dependents processed, now delete the original parent event
        const finalDefs = updatedDefs.filter(def => def.id !== currentParentEventId);
        setIsConfirmModalOpen(false);
        setConfirmModalMessage('');
        setDependentEventsQueue([]);
        setCurrentParentEventId(null);
        return finalDefs;
      }
    });
  };

  const handleCancelDependentDelete = () => {
    // Cancel the entire deletion process
    setIsConfirmModalOpen(false);
    setConfirmModalMessage('');
    setDependentEventsQueue([]);
    setCurrentParentEventId(null);
    // No change to eventDefinitions, as the original parent event was not deleted yet
  };

  const handleRestoreEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const updatedDefinitions = prev.map(def =>
        def.id === id ? { ...def, deleted: false } : def
      );

      // Now, restore any events that were relative to the restored event
      return updatedDefinitions.map(def => {
        if (def.relativeTo?.targetId === id ||
            def.relativeRecurrence?.targetId === id ||
            (def.relativeRecurrence?.targetGroupId && prev.find(d => d.id === id)?.groupId && def.relativeRecurrence.targetGroupId === prev.find(d => d.id === id)?.groupId)) {
          return { ...def, deleted: false };
        }
        return def;
      });
    });
  };

  const handleLoad = (loadedData: { calendarName: string, startDate: string, eventDefinitions: EventDefinition[] }) => {
    setCalendarName(loadedData.calendarName);
    setStartDate(loadedData.startDate);
    setEventDefinitions(loadedData.eventDefinitions);
    alert("Schedule loaded successfully!");
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onAddEventDefinition={handleAddEventDefinition}
        onLoad={handleLoad}
        eventDefinitions={eventDefinitions}
        events={calendarEvents}
        startDate={startDate}
        onStartDateChange={setStartDate}
        calendarName={calendarName}
        onCalendarNameChange={setCalendarName}
        onRemoveEventDefinition={handleDeleteEventDefinition}
        onRestoreEventDefinition={handleRestoreEventDefinition}
        onPermanentDeleteEventDefinition={handlePermanentDeleteEventDefinition}
      />
      
      <div className="main-content">
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="95vh"
            headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
            weekends={true}
            events={calendarEvents}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          message={confirmModalMessage}
          onConfirm={handleConfirmDependentDelete}
          onCancel={handleCancelDependentDelete}
        />
      )}
    </div>
  );
}

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [dependentEventsQueue, setDependentEventsQueue] = useState<EventDefinition[]>([]);
  const [currentParentEventId, setCurrentParentEventId] = useState<string | null>(null);

  const calendarEvents = useEventGenerator(eventDefinitions, startDate);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const handleAddEventDefinition = (newDefinition: EventDefinition) => {
    setEventDefinitions(prev => [...prev, newDefinition]);
  };

  const handleDeleteEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const deletedEvent = prev.find(def => def.id === id);
      const deletedEventGroupId = deletedEvent?.groupId;

      return prev.map(def => {
        if (def.id === id) {
          return { ...def, deleted: true };
        }
        if (def.relativeTo?.targetId === id ||
            (deletedEvent?.recurrence && def.relativeTo?.targetId?.startsWith(id + '-')) ||
            def.relativeRecurrence?.targetId === id ||
            (deletedEventGroupId && def.relativeRecurrence?.targetGroupId === deletedEventGroupId)) {
          return { ...def, deleted: true };
        }
        return def;
      });
    });
  };

  const handlePermanentDeleteEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const eventToDelete = prev.find(def => def.id === id);
      const eventToDeleteGroupId = eventToDelete?.groupId;

      // Identify all dependent events
      const dependents = prev.filter(def => {
        if (def.id === id) return false; // Don't include the event itself
        return def.relativeTo?.targetId === id ||
               (eventToDelete?.recurrence && def.relativeTo?.targetId?.startsWith(id + '-')) ||
               def.relativeRecurrence?.targetId === id ||
               (eventToDeleteGroupId && def.relativeRecurrence?.targetGroupId === eventToDeleteGroupId);
      });

      if (dependents.length > 0) {
        // If there are dependents, start the confirmation process
        setDependentEventsQueue(dependents);
        setCurrentParentEventId(id); // Store the ID of the event that initiated the deletion
        setIsConfirmModalOpen(true); // Open the modal for the first dependent
        setConfirmModalMessage(`The event "${eventToDelete?.title}" has dependent events. Do you want to permanently delete its dependent event: "${dependents[0].title}"?`);
        return prev; // Return current state, deletion will happen via modal callbacks
      } else {
        // No dependents, proceed with direct permanent deletion of the event itself
        return prev.filter(def => def.id !== id);
      }
    });
  };

  const handleConfirmDependentDelete = () => {
    setEventDefinitions(prev => {
      const [nextDependent, ...remainingDependents] = dependentEventsQueue;

      // Permanently delete the current dependent event
      const updatedDefs = prev.filter(def => def.id !== nextDependent.id);

      if (remainingDependents.length > 0) {
        // If there are more dependents, update the queue and show modal for next
        setDependentEventsQueue(remainingDependents);
        setConfirmModalMessage(`Do you want to permanently delete its dependent event: "${remainingDependents[0].title}"?`);
        return updatedDefs;
      } else {
        // All dependents processed, now delete the original parent event
        const finalDefs = updatedDefs.filter(def => def.id !== currentParentEventId);
        setIsConfirmModalOpen(false);
        setConfirmModalMessage('');
        setDependentEventsQueue([]);
        setCurrentParentEventId(null);
        return finalDefs;
      }
    });
  };

  const handleCancelDependentDelete = () => {
    // Cancel the entire deletion process
    setIsConfirmModalOpen(false);
    setConfirmModalMessage('');
    setDependentEventsQueue([]);
    setCurrentParentEventId(null);
    // No change to eventDefinitions, as the original parent event was not deleted yet
  };

  const handleRestoreEventDefinition = (id: string) => {
    setEventDefinitions(prev => {
      const updatedDefinitions = prev.map(def =>
        def.id === id ? { ...def, deleted: false } : def
      );

      // Now, restore any events that were relative to the restored event
      return updatedDefinitions.map(def => {
        if (def.relativeTo?.targetId === id ||
            def.relativeRecurrence?.targetId === id ||
            (def.relativeRecurrence?.targetGroupId && prev.find(d => d.id === id)?.groupId && def.relativeRecurrence.targetGroupId === prev.find(d => d.id === id)?.groupId)) {
          return { ...def, deleted: false };
        }
        return def;
      });
    });
  };

  const handleLoad = (loadedData: { calendarName: string, startDate: string, eventDefinitions: EventDefinition[] }) => {
    setCalendarName(loadedData.calendarName);
    setStartDate(loadedData.startDate);
    setEventDefinitions(loadedData.eventDefinitions);
    alert("Schedule loaded successfully!");
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onAddEventDefinition={handleAddEventDefinition}
        onLoad={handleLoad}
        eventDefinitions={eventDefinitions}
        events={calendarEvents}
        startDate={startDate}
        onStartDateChange={setStartDate}
        calendarName={calendarName}
        onCalendarNameChange={setCalendarName}
        onRemoveEventDefinition={handleDeleteEventDefinition}
        onRestoreEventDefinition={handleRestoreEventDefinition}
        onPermanentDeleteEventDefinition={handlePermanentDeleteEventDefinition}
      />
      
      <div className="main-content">
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="95vh"
            headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
            weekends={true}
            events={calendarEvents}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          message={confirmModalMessage}
          onConfirm={handleConfirmDependentDelete}
          onCancel={handleCancelDependentDelete}
        />
      )}
    </div>
  );
}
