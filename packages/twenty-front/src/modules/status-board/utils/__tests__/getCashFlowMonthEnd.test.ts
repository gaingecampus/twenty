import { getCashFlowMonthEnd } from '@/status-board/utils/getCashFlowMonthEnd';
import { getCashFlowToday } from '@/status-board/utils/getCashFlowToday';
import { getCashFlowDetailsFilters } from '@/status-board/hooks/useCashFlowDetails';
import { getCashFlowPendingExpenseFilter } from '@/status-board/hooks/useCashFlowPendingExpense';

jest.mock('@/object-record/hooks/useAggregateRecords', () => ({
  useAggregateRecords: jest.fn(),
}));
jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));

it.each([
  ['2026-10-29', '2026-10-31'],
  ['2026-11-01', '2026-11-30'],
  ['2026-12-31', '2026-12-31'],
  ['2027-02-01', '2027-02-28'],
  ['2028-02-01', '2028-02-29'],
])('limits both forecasts to the month containing %s', (today, monthEnd) => {
  expect(getCashFlowMonthEnd(today)).toBe(monthEnd);
  expect(getCashFlowDetailsFilters('backup', today).receipts).toMatchObject({
    and: expect.arrayContaining([
      { expectedDate: { gte: today } },
      { expectedDate: { lte: monthEnd } },
    ]),
  });
  expect(
    getCashFlowPendingExpenseFilter(today.slice(0, 7), today),
  ).toMatchObject({
    and: expect.arrayContaining([
      { scheduledDate: { gte: today } },
      { scheduledDate: { lte: monthEnd } },
    ]),
  });
});

it('switches the upper bound at Korean midnight instead of UTC midnight', () => {
  const today = getCashFlowToday(new Date('2026-10-31T15:00:00Z'));
  expect(today).toBe('2026-11-01');
  expect(getCashFlowMonthEnd(today)).toBe('2026-11-30');
});
