import { renderHook } from '@testing-library/react';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useCashFlowDetails } from '@/status-board/hooks/useCashFlowDetails';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION as TOTAL } from 'twenty-shared/constants';

jest.mock('@/object-record/hooks/useAggregateRecords', () => ({
  useAggregateRecords: jest.fn(),
}));
jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));

describe('cash flow detail sources', () => {
  const refetch = jest.fn().mockResolvedValue({});
  let missingBank = false;
  let conflictingBank = false;
  let invalidCount = 0;
  let sum = '125000000';
  afterEach(() => jest.useRealTimers());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-27T15:00:00Z'));
    missingBank = false;
    conflictingBank = false;
    invalidCount = 0;
    sum = '125000000';
    (useFindManyRecords as jest.Mock).mockImplementation(({ filter }) => ({
      records:
        missingBank && filter.and[1].bankKey.eq === 'nh'
          ? []
          : [
              {
                id: 'latest',
                transactionAt: '2026-10-28T00:00:00Z',
                balance: { amountMicros: '100000000', currencyCode: 'KRW' },
              },
              {
                id: 'previous',
                transactionAt: conflictingBank
                  ? '2026-10-28T00:00:00Z'
                  : '2026-10-27T00:00:00Z',
                balance: { amountMicros: '50000000', currencyCode: 'KRW' },
              },
            ],
      loading: false,
      error: undefined,
      refetch,
    }));
    (useAggregateRecords as jest.Mock).mockImplementation(
      ({ recordGqlFieldsAggregate }) => ({
        data: {
          [TOTAL]: {
            COUNT: recordGqlFieldsAggregate.outstandingAmount
              ? 1500
              : invalidCount,
          },
          outstandingAmount: { SUM: sum },
        },
        loading: false,
        error: undefined,
        refetch,
      }),
    );
  });
  it('uses latest balances, server sum, and same backup filters for drilldown', () => {
    const { result, rerender } = renderHook(() =>
      useCashFlowDetails('backup-a'),
    );
    expect(result.current.banks.map((bank) => bank.amount)).toEqual([
      100, 100, 100,
    ]);
    expect(result.current.incomingAmount).toBe(125);
    expect(useAggregateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ filter: result.current.filters.receipts }),
    );
    expect(result.current.filters.receipts).toEqual({
      and: [
        { sourceHash: { eq: 'backup-a' } },
        { inclusionStatus: { eq: '포함' } },
        { expectedDate: { gte: '2026-10-28' } },
      ],
    });
    expect(result.current.filters.transactions).toEqual({
      sourceHash: { eq: 'backup-a' },
    });
    expect(useFindManyRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        orderBy: [
          { transactionAt: 'DescNullsLast' },
          { sourceRow: 'AscNullsLast' },
        ],
      }),
    );
    sum = '225000000';
    rerender();
    expect(result.current.incomingAmount).toBe(225);
  });
  it('does not replace missing bank data with zero', () => {
    missingBank = true;
    expect(
      renderHook(() => useCashFlowDetails('backup-a')).result.current.banks[2]
        .amount,
    ).toBeNull();
  });
  it('rejects conflicting balances at the latest timestamp', () => {
    conflictingBank = true;
    expect(
      renderHook(() => useCashFlowDetails('backup-a')).result.current.banks[0]
        .amount,
    ).toBeNull();
  });
  it('rejects invalid currency rather than showing a partial sum', () => {
    invalidCount = 1;
    expect(
      renderHook(() => useCashFlowDetails('backup-a')).result.current
        .incomingAmount,
    ).toBeNull();
  });
  it('refreshes all three banks and both incoming checks', async () => {
    await renderHook(() =>
      useCashFlowDetails('backup-a'),
    ).result.current.refetch();
    expect(refetch).toHaveBeenCalledTimes(5);
  });
});
