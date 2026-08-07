// Each day cell gets a fixed height in print (see the .fc-daygrid-day-frame
// rule in index.css) so six weeks always fill exactly one sheet. A day with
// too many treatments to fit at full size shrinks its own event text instead
// of growing the row, which would otherwise push the rest of the month onto
// a mostly-blank second page.
//
// This is a printed chemo schedule: a dose silently clipped off the page is
// far worse than tiny text or a stray second page, so the floor here is a
// legibility limit, not a hard stop. If a cell still overflows once text is
// unreadably small, the cell is let grow past its row height rather than
// clip — the one week may spill to a second page, but nothing is dropped.
const MIN_PRINT_SCALE = 0.15;
const PRINT_SCALE_STEP = 0.05;

export function shrinkOverflowingPrintDays() {
  const frames = document.querySelectorAll<HTMLElement>('.fc-daygrid-day-frame');

  frames.forEach(frame => {
    frame.style.removeProperty('--print-scale');
    frame.style.removeProperty('overflow');

    let scale = 1;
    while (frame.scrollHeight > frame.clientHeight && scale > MIN_PRINT_SCALE) {
      scale = Math.max(MIN_PRINT_SCALE, scale - PRINT_SCALE_STEP);
      frame.style.setProperty('--print-scale', String(scale));
    }

    if (frame.scrollHeight > frame.clientHeight) {
      frame.style.setProperty('overflow', 'visible');
    }
  });
}

export function clearPrintDayShrink() {
  document.querySelectorAll<HTMLElement>('.fc-daygrid-day-frame').forEach(frame => {
    frame.style.removeProperty('--print-scale');
    frame.style.removeProperty('overflow');
  });
}
