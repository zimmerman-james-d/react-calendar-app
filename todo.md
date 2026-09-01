# To-Do List for Calendar Features
## Core Functionality
- ~~Dynamic Event Updates~~ Done: Ensure that if an event is moved, any other events that are relative to it automatically update their positions on the calendar.

- ~~Event Edit~~ Done

- ~~Session Storage~~ Done: Persist the event list through page refreshes and navigating away from the page.

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

- ~~Rebase start date~~ Done: a "Rebase" button beside Start Date drops
  everything before a chosen day (entered as a protocol day number by default,
  or as a date) and renumbers that day as day 1, for when treatment is delayed
  because a patient missed counts. The rebase itself moves nothing on the
  calendar; pushing the resumed schedule out by the delay is a normal Start Date
  edit afterwards.

  Dropped events are frozen to the real dates they actually fell on and
  soft-deleted, rather than kept as offsets from a day 1 they are no longer part
  of. Freezing is what makes the deleted list readable, lets a wrong rebase be
  undone from "All Events" exactly where things were, and — most importantly —
  stops the dropped past from sliding forward when the Start Date is then
  changed to apply the delay. Invariant: nothing in the deleted list is measured
  against day 1, so nothing there ever moves.

  A recurring series running across the cut is split into a frozen past half
  (a new `dropped-`-prefixed definition, keeping its original real start date)
  and a live half that keeps the original definition and group ids so events
  written relative to its instances or its group keep resolving. The live half's
  window now opens on the cut date, which re-anchors the recurrence cycle, so
  its weeklySelections are rotated by the number of weeks the anchor moved —
  otherwise a multi-week cycle would silently fire on the wrong weeks. See
  rotateForNewWindowStart in utils/rebaseStartDate.ts.

  Events pinned to literal dates cannot follow the later Start Date shift, so
  the confirmation lists them for a manual look.

- ~~Instance-relative events lost on start-date change~~ Done (found while
  building the rebase): an event written relative to one instance of a
  recurring series stores its target as the series id plus that instance's
  literal date, so moving the start date left the reference dangling and the
  event vanished from the calendar with no warning. On the real AALL1231
  sample this silently deleted both "Check Counts Locally (Need ANC >=750)"
  draws — the count checks that gate each treatment block. The embedded date
  is now rewritten by the same shift.

## Holiday & Warning System
- Add Holidays: Implement a feature to add a list of holidays to the calendar.

- Holiday Warnings: Create a system to warn the user if an event is scheduled on a holiday.

- Saving Holidays: Allow the user's custom holiday list to be saved and loaded.

## Data Management & Export
- **SHELVED** — iCal Export / Google Calendar Export: Add a feature to export the event schedule to a standard .ics file (which would also cover Google Calendar, since it accepts .ics via its own Import feature — no separate OAuth/API integration needed). Shelved for the same reason as the QR handoff spike below: a patient's schedule can include COG (Children's Oncology Group) clinical trial protocol details, and handing the patient a physical paper calendar is a single object with no further copies, while any digital export (.ics file, calendar link) can be re-uploaded, forwarded, or fed into chatbots/other tooling once it leaves this app — a categorically bigger leak surface than paper. Same logic would block any other "hand the patient a digital copy" feature (email, cloud sync, etc.), not just QR/iCal specifically.

- **SHELVED** — Spike: QR-code calendar handoff. Idea was to print a QR code on the first month's printout (using the first/last empty day) encoding the ICS data, so a patient can scan it with their phone and have the schedule populate directly instead of being handed a paper calendar. Shelved for the confidentiality reason above.

## UI/UX
- ~~Fix Choppy Calendar Resize~~ Done: Smooth out the animation when the sidebar expands and collapses.

- ~~Fix limited number of items displayed in editable fields.~~ Done: the "All Events" accordion had a fixed 900px `max-height` with `overflow: hidden`, which silently clipped and made unclickable any items past roughly the 12th — now the open state scrolls (`overflow-y: auto`) instead of clipping.

- ~~Fix bad print lines~~ Done: the doubled column rules came from the header
  table and day grid being forced to different widths by the `98vw` print
  overrides; FullCalendar is now switched into its own print mode instead.

  