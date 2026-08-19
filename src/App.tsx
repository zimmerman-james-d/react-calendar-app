import React, { useState, useRef, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Sidebar } from './Sidebar';
import { EventDefinition, SaveData } from './types';
import { useEventGenerator } from './utils/eventUtils';
import { shrinkOverflowingPrintDays, clearPrintDayShrink } from './utils/printLayout';
import { getPrintMonths } from './utils/printMonths';
import { ConfirmationModal } from './components/ConfirmationModal';
import { EditEventModal } from './components/EditEventModal';
import { PrintMonths } from './components/PrintMonths';

const SESSION_STORAGE_KEY = 'calendar-app-session';

function loadSessionState(): SaveData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [sessionState] = useState(loadSessionState);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>(sessionState?.eventDefinitions ?? []);
  const [startDate, setStartDate] = useState<string>(sessionState?.startDate ?? '');
  const [calendarName, setCalendarName] = useState<string>(sessionState?.calendarName ?? '');
  const calendarRef = useRef<FullCalendar>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const printCalendarRefsRef = useRef<(FullCalendar | null)[]>([]);

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [dependentEventsQueue, setDependentEventsQueue] = useState<EventDefinition[]>([]);
  const [currentParentEventId, setCurrentParentEventId] = useState<string | null>(null);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventDefinition | null>(null);

  // State for new-calendar confirmation
  const [isNewCalendarConfirmOpen, setIsNewCalendarConfirmOpen] = useState(false);

  const calendarEvents = useEventGenerator(eventDefinitions, startDate);
  const printMonths = useMemo(() => getPrintMonths(startDate, calendarEvents), [startDate, calendarEvents]);

  useEffect(() => {
    const data: SaveData = { calendarName, startDate, eventDefinitions };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  }, [calendarName, startDate, eventDefinitions]);

  // The sidebar's width animates via CSS transition, and FullCalendar sits
  // in the flex sibling that gets squeezed/stretched as that plays out. A
  // ResizeObserver lets FullCalendar re-measure on every frame of that
  // transition instead of jumping to its final size once after a fixed
  // delay, which is what caused the choppy resize.
  useEffect(() => {
    const container = calendarContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        calendarRef.current?.getApi().updateSize();
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  // FullCalendar only lays itself out for paper when it is told a print is
  // starting. Without this it prints its on-screen scrolling layout, so the
  // header row and the day grid end up measured against different widths.
  useEffect(() => {
    const handleBeforePrint = () => {
      if (printMonths) {
        if (!calendarName.trim()) {
          window.alert(
            "This calendar has no name set. Every page of the printed plan will be unlabeled, which makes a lost or separated page hard to identify. You can continue printing without one."
          );
        }
        printCalendarRefsRef.current.forEach(instance => instance?.getApi().trigger('_beforeprint'));
      } else {
        calendarRef.current?.getApi().trigger('_beforeprint');
      }
      shrinkOverflowingPrintDays();
    };
    const handleAfterPrint = () => {
      if (printMonths) {
        printCalendarRefsRef.current.forEach(instance => instance?.getApi().trigger('_afterprint'));
      } else {
        calendarRef.current?.getApi().trigger('_afterprint');
      }
      clearPrintDayShrink();
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printMonths, calendarName]);

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

  const handleEditEventDefinition = (definition: EventDefinition) => {
    setEventToEdit(definition);
    setIsEditModalOpen(true);
  };

  const handleUpdateEventDefinition = (updatedDefinition: EventDefinition) => {
    setEventDefinitions(prev =>
      prev.map(def => (def.id === updatedDefinition.id ? updatedDefinition : def))
    );
    setIsEditModalOpen(false);
    setEventToEdit(null);
  };

  const handleConfirmNewCalendar = () => {
    setCalendarName('');
    setStartDate('');
    setEventDefinitions([]);
    setIsNewCalendarConfirmOpen(false);
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
        onEditEventDefinition={handleEditEventDefinition}
        onRequestNewCalendar={() => setIsNewCalendarConfirmOpen(true)}
      />

      <div className={`main-content${printMonths ? ' print-multipage-active' : ''}`}>
        {!printMonths && calendarName && <h1 className="print-title">{calendarName}</h1>}
        <div className="calendar-container" ref={calendarContainerRef}>
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
        {printMonths && (
          <PrintMonths
            months={printMonths}
            calendarName={calendarName}
            events={calendarEvents}
            registerRef={(index, instance) => { printCalendarRefsRef.current[index] = instance; }}
          />
        )}
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

      {/* New Calendar Confirmation Modal */}
      {isNewCalendarConfirmOpen && (
        <ConfirmationModal
          isOpen={isNewCalendarConfirmOpen}
          message="This will permanently delete the current calendar name, start date, and all events. This cannot be undone. Continue?"
          confirmLabel="Start New Calendar"
          onConfirm={handleConfirmNewCalendar}
          onCancel={() => setIsNewCalendarConfirmOpen(false)}
        />
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateEventDefinition}
          eventToEdit={eventToEdit}
          eventDefinitions={eventDefinitions}
          events={calendarEvents}
          startDate={startDate}
        />
      )}
    </div>
  );
}
