import { getCashFlowToday } from '@/status-board/utils/getCashFlowToday';

describe('cash flow cutoff in Korea', () => {
  it.each([
    ['2026-10-27T14:59:59Z', '2026-10-27'],
    ['2026-10-27T15:00:00Z', '2026-10-28'],
    ['2026-10-31T15:00:00Z', '2026-11-01'],
  ])('uses the Korean calendar date for %s', (instant, expected) => {
    expect(getCashFlowToday(new Date(instant))).toBe(expected);
  });
});
