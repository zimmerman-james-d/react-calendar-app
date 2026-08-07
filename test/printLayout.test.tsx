import { shrinkOverflowingPrintDays, clearPrintDayShrink } from '../src/utils/printLayout';

// jsdom never lays out real boxes, so clientHeight/scrollHeight are always 0.
// These frames stand in for real ones by making the two heights independently
// controllable and reactive to --print-scale, the way a shrinking font would
// shrink real scrollHeight in a browser.
function makeFrame(naturalContentHeight: number, cellHeight = 100) {
  const frame = document.createElement('div');
  frame.className = 'fc-daygrid-day-frame';
  Object.defineProperty(frame, 'clientHeight', { value: cellHeight, configurable: true });
  Object.defineProperty(frame, 'scrollHeight', {
    configurable: true,
    get() {
      const scale = parseFloat(frame.style.getPropertyValue('--print-scale') || '1');
      return naturalContentHeight * scale;
    },
  });
  document.body.appendChild(frame);
  return frame;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('shrinkOverflowingPrintDays', () => {
  it('leaves a day that already fits untouched', () => {
    const frame = makeFrame(80, 100);
    shrinkOverflowingPrintDays();
    expect(frame.style.getPropertyValue('--print-scale')).toBe('');
    expect(frame.style.overflow).toBe('');
  });

  it('shrinks a crowded day just enough to fit', () => {
    const frame = makeFrame(150, 100);
    shrinkOverflowingPrintDays();
    const scale = parseFloat(frame.style.getPropertyValue('--print-scale'));
    expect(scale).toBeLessThan(1);
    expect(frame.scrollHeight).toBeLessThanOrEqual(frame.clientHeight);
    expect(frame.style.overflow).toBe('');
  });

  it('only shrinks the crowded day, not its unrelated siblings', () => {
    const crowded = makeFrame(150, 100);
    const light = makeFrame(50, 100);
    shrinkOverflowingPrintDays();
    expect(parseFloat(crowded.style.getPropertyValue('--print-scale'))).toBeLessThan(1);
    expect(light.style.getPropertyValue('--print-scale')).toBe('');
  });

  it('falls back to letting an impossibly full day overflow instead of clipping it', () => {
    const frame = makeFrame(1000, 100);
    shrinkOverflowingPrintDays();
    expect(frame.style.overflow).toBe('visible');
  });

  it('re-measures from full size each call instead of compounding previous shrinks', () => {
    const frame = makeFrame(150, 100);
    shrinkOverflowingPrintDays();
    const firstScale = frame.style.getPropertyValue('--print-scale');
    shrinkOverflowingPrintDays();
    expect(frame.style.getPropertyValue('--print-scale')).toBe(firstScale);
  });
});

describe('clearPrintDayShrink', () => {
  it('removes the scale and overflow overrides applied by shrinkOverflowingPrintDays', () => {
    const frame = makeFrame(1000, 100);
    shrinkOverflowingPrintDays();
    clearPrintDayShrink();
    expect(frame.style.getPropertyValue('--print-scale')).toBe('');
    expect(frame.style.overflow).toBe('');
  });
});
