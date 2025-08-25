import React from 'react';
import { EventInput } from '@fullcalendar/core';
import { CollapsibleSection } from './components/CollapsibleSection';
import { SingleEventForm } from './components/SingleEventForm';
import { RecurringEventForm } from './components/RecurringEventForm';
import { EventList } from './components/EventList';
import { EventDefinition } from '../types';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    onAddEventDefinition: (definition: EventDefinition) => void;
    eventDefinitions: EventDefinition[];
    events: EventInput[];
    startDate: string;
    onStartDateChange: (date: string) => void;
}

export function Sidebar({ 
    isOpen, 
    toggleSidebar, 
    onAddEventDefinition,
    eventDefinitions,
    events, 
    startDate, 
    onStartDateChange 
}: SidebarProps) {
    return (
        <div className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar">
                <div className="top-level-form-group">
                    <label htmlFor="start-date">Start Date</label>
                    <input 
                        type="date" 
                        id="start-date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                    />
                </div>

                <CollapsibleSection title="Single Event" initialOpen={true}>
                    <SingleEventForm 
                        onAddEventDefinition={onAddEventDefinition}
                        events={events}
                        startDate={startDate}
                    />
                </CollapsibleSection>

                <CollapsibleSection title="Recurring Event">
                    <RecurringEventForm 
                        onAddEventDefinition={onAddEventDefinition}
                        eventDefinitions={eventDefinitions}
                    />
                </CollapsibleSection>

                <CollapsibleSection title="All Events">
                    <EventList eventDefinitions={eventDefinitions} />
                </CollapsibleSection>
            </div>
            <button onClick={toggleSidebar} className="sidebar-toggle-button">{isOpen ? '‹' : '›'}</button>
        </div>
    );
}
