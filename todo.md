# To-Do List for Calendar Features
## Core Functionality
- Dynamic Event Updates: Ensure that if an event is moved, any other events that are relative to it automatically update their positions on the calendar.

- Event Edit

- Session Storage: Persist the event list through page refreshes and navigating away from the page.

- ~~Calendar print view (No sidebar)~~ Done: sidebar/nav hidden, calendar name printed as a heading, month fills the sheet.

- Multi-page print

- ~~Save to encrypted string/qrcode?~~ Done (string half): "Copy as Text" /
  "Load from Text" let a calendar be copy-pasted (e.g. into Teams) instead of
  saved to disk, for shared hospital computers without file-write access.
  Uses a compact binary encoding + deflate + AES, separate from the existing
  .tclx file format. QR code still open.

- Title compression dictionary: shrink the "Copy as Text" string further by
  shipping a small preset compression dictionary of common drug/lab/procedure
  names in the app bundle (deflate can match against it without the words
  needing to appear in the string itself). Measured ~7-16% additional size
  reduction in testing, more when more titles match. Not built yet — needs a
  real curated term list from actual clinical usage, and the encode/decode
  sides must share the exact same dictionary bytes, so changing it later
  needs a version bump in compactSaveFormat.tsx's format-version byte.

## Holiday & Warning System
- Add Holidays: Implement a feature to add a list of holidays to the calendar.

- Holiday Warnings: Create a system to warn the user if an event is scheduled on a holiday.

- Saving Holidays: Allow the user's custom holiday list to be saved and loaded.

## Data Management & Export
- iCal Export: Add a feature to export the event schedule to a standard .ics file.

- Google Calendar Export: Add a feature to export events directly to a user's Google Calendar.

## UI/UX
- Fix Choppy Calendar Resize: Smooth out the animation when the sidebar expands and collapses.

- ~~Fix limited number of items displayed in editable fields.~~ Done: the "All Events" accordion had a fixed 900px `max-height` with `overflow: hidden`, which silently clipped and made unclickable any items past roughly the 12th — now the open state scrolls (`overflow-y: auto`) instead of clipping.

- ~~Fix bad print lines~~ Done: the doubled column rules came from the header
  table and day grid being forced to different widths by the `98vw` print
  overrides; FullCalendar is now switched into its own print mode instead.

  