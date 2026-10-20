import {
  formatPersonalDashboardGrowth,
  getPersonalDashboardComparison,
} from '@/personal-dashboard/utils/getPersonalDashboardComparison';

describe('personal dashboard monthly comparison', () => {
  it('uses the Korean calendar and crosses the year boundary', () => {
    expect(
      getPersonalDashboardComparison(new Date('2026-12-31T15:00:00Z')),
    ).toEqual({
      currentStart: '2027-01-01',
      currentEnd: '2027-01-01',
      previousStart: '2026-12-01',
      previousEnd: '2026-12-01',
    });
  });
  it('clamps the previous period to the last day of a shorter month', () => {
    expect(
      getPersonalDashboardComparison(new Date('2024-03-31T02:00:00Z'))
        .previousEnd,
    ).toBe('2024-02-29');
  });
  it('compares the same calendar day mid-month', () => {
    expect(
      getPersonalDashboardComparison(new Date('2026-10-17T02:00:00Z'))
        .previousEnd,
    ).toBe('2026-09-17');
  });
  it.each([
    [3, 2, '+50%'],
    [1, 2, '-50%'],
    [0, 2, '-100%'],
    [0, 0, '변동 없음'],
    [3, 0, '신규 발생'],
    [2, 2, '변동 없음'],
  ])('formats %s versus %s', (current, previous, expected) => {
    expect(
      formatPersonalDashboardGrowth(current as number, previous as number),
    ).toBe(expected);
  });
});
