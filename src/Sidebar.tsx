import React from 'react';
import { EventInput } from '@fullcalendar/core';
import { CollapsibleSection } from './components/CollapsibleSection';
import { SingleEventForm } from './components/SingleEventForm';
import { RecurringEventForm } from './components/RecurringEventForm';
import { EventList } from './components/EventList';
import { SaveLoadControls } from './components/SaveLoadControls';
import { EventDefinition } from './types';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    onAddEventDefinition: (definition: EventDefinition) => void;
    onUpdateEventDefinition: (definition: EventDefinition) => void; // New prop
    onLoad: (data: { calendarName: string, startDate: string, eventDefinitions: EventDefinition[] }) => void;
    eventDefinitions: EventDefinition[];
    events: EventInput[];
    startDate: string;
    onStartDateChange: (date: string) => void;
    calendarName: string;
    onCalendarNameChange: (name: string) => void;
    onRemoveEventDefinition: (id: string) => void;
    onRestoreEventDefinition: (id: string) => void;
    onPermanentDeleteEventDefinition: (id: string) => void;
    onEditEventDefinition: (event: EventDefinition) => void;
    editingEvent: EventDefinition | null;
    setEditingEvent: (event: EventDefinition | null) => void;
}

export function Sidebar({
    isOpen,
    toggleSidebar,
    onAddEventDefinition,
    onUpdateEventDefinition, // New prop
    onLoad,
    eventDefinitions,
    events,
    startDate,
    onStartDateChange,
    calendarName,
    onCalendarNameChange,
    onRemoveEventDefinition,
    onRestoreEventDefinition,
    onPermanentDeleteEventDefinition,
    onEditEventDefinition,
    editingEvent,
    setEditingEvent
}: SidebarProps) {
    return (
        <div className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="top-level-form-group">
                        <label htmlFor="calendar-name">Calendar Name</label>
                        <input 
                            type="text" 
                            id="calendar-name"
                            value={calendarName}
                            onChange={(e) => onCalendarNameChange(e.target.value)}
                            placeholder="e.g., Schedule"
                        />
                    </div>
                    <div className="top-level-form-group">
                        <label htmlFor="start-date">Start Date</label>
                        <input 
                            type="date" 
                            id="start-date"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="sidebar-content">
                    <CollapsibleSection title="Single Event" initialOpen={true}>
                        <SingleEventForm 
                            onAddEventDefinition={onAddEventDefinition}
                            onUpdateEventDefinition={onUpdateEventDefinition} // New prop
                            events={events}
                            startDate={startDate}
                            editingEvent={editingEvent}
                            setEditingEvent={setEditingEvent}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection title="Recurring Event">
                        <RecurringEventForm 
                            onAddEventDefinition={onAddEventDefinition}
                            onUpdateEventDefinition={onUpdateEventDefinition} // New prop
                            eventDefinitions={eventDefinitions}
                            editingEvent={editingEvent}
                            setEditingEvent={setEditingEvent}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection title="All Events">
                        <EventList 
                            eventDefinitions={eventDefinitions} 
                            onRemoveEventDefinition={onRemoveEventDefinition}
                            onRestoreEventDefinition={onRestoreEventDefinition}
                            onPermanentDeleteEventDefinition={onPermanentDeleteEventDefinition} // New prop
                            onEditEventDefinition={onEditEventDefinition}
                        />
                    </CollapsibleSection>
                </div>

                <div className="sidebar-footer">
                    <SaveLoadControls 
                        eventDefinitions={eventDefinitions}
                        startDate={startDate}
                        calendarName={calendarName}
                        onLoad={onLoad}
                    />
                </div>
            </div>
            <button onClick={toggleSidebar} className="sidebar-toggle-button">{isOpen ? '‹' : '›'}</button>
        </div>
    );
}
