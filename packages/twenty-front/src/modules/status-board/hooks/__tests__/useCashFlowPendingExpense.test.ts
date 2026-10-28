import { renderHook } from '@testing-library/react';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { useCashFlowPendingExpense } from '@/status-board/hooks/useCashFlowPendingExpense';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION as TOTAL } from 'twenty-shared/constants';

jest.mock('@/object-record/hooks/useAggregateRecords', () => ({
  useAggregateRecords: jest.fn(),
}));

describe('CRM pending expense cash flow', () => {
  const refetchTotals = jest.fn().mockResolvedValue({});
  const refetchCurrencies = jest.fn().mockResolvedValue({});
  let sum: number | string | null;
  let count: number;
  let invalidCount: number;
  let loading: boolean;
  let error: Error | undefined;

  afterEach(() => jest.useRealTimers());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-27T15:00:00Z'));
    sum = '125000000';
    count = 1500;
    invalidCount = 0;
    loading = false;
    error = undefined;
    (useAggregateRecords as jest.Mock).mockImplementation(
      ({ recordGqlFieldsAggregate }) => {
        const invalid = !recordGqlFieldsAggregate.plannedCashAmount;
        return {
          data: {
            [TOTAL]: { COUNT: invalid ? invalidCount : count },
            plannedCashAmount: { SUM: sum },
          },
          loading,
          error,
          refetch: invalid ? refetchCurrencies : refetchTotals,
        };
      },
    );
  });

  it('uses the server total across all rows and refreshes after CRM edits', () => {
    const { result, rerender } = renderHook(() =>
      useCashFlowPendingExpense('2026-10'),
    );
    expect(result.current.amount).toBe(125);
    expect(useAggregateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ filter: result.current.filter }),
    );
    sum = '175000000';
    rerender();
    expect(result.current.amount).toBe(175);
    expect(result.current.filter).toEqual({
      and: [
        { expenseMonth: { eq: '2026-10' } },
        { scheduledDate: { gte: '2026-10-28' } },
        {
          or: [
            { sourceRecordType: { is: 'NULL' } },
            { sourceRecordType: { eq: '' } },
          ],
        },
      ],
    });
    expect(useAggregateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ objectNameSingular: 'pendingExpense' }),
    );
  });

  it('returns zero for an empty month', () => {
    count = 0;
    sum = null;
    expect(
      renderHook(() => useCashFlowPendingExpense('2026-11')).result.current
        .amount,
    ).toBe(0);
  });

  it.each(['loading', 'error', 'currency', 'missing', 'unsafe'])(
    'does not show a partial or misleading amount on %s',
    (failure) => {
      if (failure === 'loading') loading = true;
      if (failure === 'error') error = new Error('Permission denied');
      if (failure === 'currency') invalidCount = 1;
      if (failure === 'missing') sum = null;
      if (failure === 'unsafe') sum = '9007199254740993';
      expect(
        renderHook(() => useCashFlowPendingExpense('2026-10')).result.current
          .amount,
      ).toBeNull();
    },
  );

  it('refreshes both the total and currency validation', async () => {
    const { result } = renderHook(() => useCashFlowPendingExpense('2026-10'));
    await result.current.refetch();
    expect(refetchTotals).toHaveBeenCalledTimes(1);
    expect(refetchCurrencies).toHaveBeenCalledTimes(1);
  });
});
