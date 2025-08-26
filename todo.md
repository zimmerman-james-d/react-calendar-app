# To-Do List for Calendar Features
## Core Functionality
- Repeating Relative Events for a Single Event: Allow a single event to be the trigger for a recurring series (e.g., "follow-up every Monday after this specific appointment").

- Dynamic Event Updates: Ensure that if an event is moved, any other events that are relative to it automatically update their positions on the calendar.

- Session Storage: Persist the event list through page refreshes and navigating away from the page.

## Holiday & Warning System
- Add Holidays: Implement a feature to add a list of holidays to the calendar.

- Holiday Warnings: Create a system to warn the user if an event is scheduled on a holiday.

- Saving Holidays: Allow the user's custom holiday list to be saved and loaded.

## Data Management & Export
- Saving & Loading: Implement functionality to save the entire event schedule to a file and load it back into the application.

- iCal Export: Add a feature to export the event schedule to a standard .ics file.

- Google Calendar Export: Add a feature to export events directly to a user's Google Calendar.

## Compliance & Security
- Encryption: Implement encryption for the saved event data ("at rest").

- HIPAA Analysis: Conduct a thorough analysis of the application's features and data handling to ensure it remains outside the scope of HIPAA regulations.

## UI/UX
- Fix Choppy Calendar Resize: Smooth out the animation when the sidebar expands and collapses.
