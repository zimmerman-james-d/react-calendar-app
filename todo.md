# To-Do List for Calendar Features
## Core Functionality
- Repeating Relative Events for a Single Event: Allow a single event to be the trigger for a single event or relative to the start date.
  - Single Event:
    An action occurs 4 days after an event created on August 23rd. And 2 days before that same single event.
  - Start Date:
    An action occurs 10 days before the start date and 36 days after the start date.

- Dynamic Event Updates: Ensure that if an event is moved, any other events that are relative to it automatically update their positions on the calendar.

- Session Storage: Persist the event list through page refreshes and navigating away from the page.

## Holiday & Warning System
- Add Holidays: Implement a feature to add a list of holidays to the calendar.

- Holiday Warnings: Create a system to warn the user if an event is scheduled on a holiday.

- Saving Holidays: Allow the user's custom holiday list to be saved and loaded.

## Data Management & Export
- iCal Export: Add a feature to export the event schedule to a standard .ics file.

- Google Calendar Export: Add a feature to export events directly to a user's Google Calendar.

## UI/UX
- Fix Choppy Calendar Resize: Smooth out the animation when the sidebar expands and collapses.
