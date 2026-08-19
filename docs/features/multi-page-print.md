# Multi-Page Print

Printing covers the whole treatment plan instead of just the on-screen month: one page per calendar month, from the month containing the plan's start date through the month of the last scheduled event, in chronological order.

## Behavior

1. Print is still triggered the same way it is today — the browser's own File > Print / Ctrl+P. No new button or UI control.
2. Range = month of the plan's **start date** → month of the **last scheduled event**, inclusive. Use the start date rather than the earliest event, since events can be offset before or after it (offsets can be negative).
3. Months in between with no events still get a page, printed as a normal blank month with a line noting it has no scheduled events for that month. (Without this, a caregiver can't tell a deliberately blank month from a missing page.)
4. Each month's page looks like today's single-month print: calendar name heading, month/year, day grid. Needs an explicit page break between months so consecutive months don't merge onto one sheet or split across two — today's single-month layout only guarantees "fits one page" in isolation, with only one month ever in the print document at a time.
5. Per-month shrink-to-fit is unchanged: an unusually busy day shrinks its text to stay on the page. If a day still can't fit at the minimum legible size, let it grow past its row and let that month spill onto an extra sheet — same exception the current single-month print already makes, don't try to prevent it.
6. The last page in the printed sequence gets a short "end of plan" marker, so a lost final page doesn't read as "treatment ends here."
7. If the calendar has no name set, warn before the print dialog opens. Today an unnamed calendar just omits the heading — fine for one page, but a multi-page stack with zero identifying text on every sheet is a real hand-off risk. Let the person continue anyway if they choose.
8. No page cap. The browser's own print preview already shows the page count before anything prints — don't add a warning or confirmation step for a large plan.
9. The on-screen calendar view must be unchanged after printing, whether the print dialog is completed or canceled.

## Edge cases

| Condition | Behavior |
|---|---|
| Calendar has no events at all (no event definitions, or definitions that currently generate no dates) | Fall back to today's behavior: print only the on-screen month, as a single page. |
| Plan's events all fall in one month | Same flow, produces one page — no special-casing needed. |

## Out of scope

- No UI for picking a custom print range (e.g., "just March–June"). Always the full plan.
- No page numbers / "page X of Y". The month/year heading on every page plus the end-of-plan marker (item 6) cover the two failure modes numbering would otherwise fix.

## Relevant code

- `src/App.tsx:78-96` — `beforeprint`/`afterprint` handling, FullCalendar print hooks
- `src/App.tsx:251` — print-only calendar-name heading (currently conditional on non-empty name)
- `src/utils/printLayout.ts` — shrink-to-fit / legibility-floor spill logic (per-month, needs to run per rendered month)
- `src/utils/eventUtils.tsx` — event generation; `startDate` is the plan anchor, separate from any event
- `src/index.css:510-639` — `@media print` rules, including the fixed week-row height that makes one month fill one page
