import { MAX_DAY_NUMBER, clampDayNumber, clampDayOffset } from '../src/utils/dayLimits';

describe('day limits', () => {
  it('caps at ten years', () => {
    expect(MAX_DAY_NUMBER).toBe(3650);
  });

  describe('clampDayNumber', () => {
    it('leaves ordinary protocol days alone', () => {
      expect(clampDayNumber(1)).toBe(1);
      expect(clampDayNumber(43)).toBe(43);
      expect(clampDayNumber(MAX_DAY_NUMBER)).toBe(MAX_DAY_NUMBER);
    });

    it('pulls anything past the cap back to it', () => {
      expect(clampDayNumber(MAX_DAY_NUMBER + 1)).toBe(MAX_DAY_NUMBER);
      expect(clampDayNumber(1e9)).toBe(MAX_DAY_NUMBER);
      expect(clampDayNumber(Infinity)).toBe(1);
    });

    it('treats day zero, negatives and junk as day 1', () => {
      expect(clampDayNumber(0)).toBe(1);
      expect(clampDayNumber(-20)).toBe(1);
      expect(clampDayNumber(NaN)).toBe(1);
    });

    it('drops fractions rather than passing them to date arithmetic', () => {
      expect(clampDayNumber(4.7)).toBe(4);
    });
  });

  describe('clampDayOffset', () => {
    it('allows zero but not negatives', () => {
      expect(clampDayOffset(0)).toBe(0);
      expect(clampDayOffset(-3)).toBe(0);
      expect(clampDayOffset(NaN)).toBe(0);
    });

    it('caps large offsets', () => {
      expect(clampDayOffset(7)).toBe(7);
      expect(clampDayOffset(1e12)).toBe(MAX_DAY_NUMBER);
    });
  });
});
