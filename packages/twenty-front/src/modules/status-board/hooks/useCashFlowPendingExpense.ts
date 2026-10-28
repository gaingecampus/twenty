import { getCashFlowToday } from '@/status-board/utils/getCashFlowToday';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { readCashFlowCurrency } from '@/status-board/utils/calculateCashFlow';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION } from 'twenty-shared/constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const getCashFlowPendingExpenseFilter = (
  month: string,
  today = getCashFlowToday(),
): RecordGqlOperationFilter => ({
  and: [
    { expenseMonth: { eq: month } },
    { scheduledDate: { gte: today } },
    {
      or: [
        { sourceRecordType: { is: 'NULL' } },
        { sourceRecordType: { eq: '' } },
      ],
    },
  ],
});

export const useCashFlowPendingExpense = (
  month: string,
  today = getCashFlowToday(),
) => {
  const filter = getCashFlowPendingExpenseFilter(month, today);
  const totals = useAggregateRecords({
    objectNameSingular: 'pendingExpense',
    filter,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
      plannedCashAmount: [AggregateOperations.SUM],
    },
  });
  const invalidCurrencies = useAggregateRecords({
    objectNameSingular: 'pendingExpense',
    filter: {
      and: [
        filter,
        { not: { plannedCashAmount: { amountMicros: { is: 'NULL' } } } },
        {
          or: [
            { plannedCashAmount: { currencyCode: { neq: 'KRW' } } },
            { plannedCashAmount: { currencyCode: { is: 'NULL' } } },
          ],
        },
      ],
    },
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
  });
  const count = totals.data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  const invalidCount =
    invalidCurrencies.data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  const loading = totals.loading || invalidCurrencies.loading;
  const error = totals.error ?? invalidCurrencies.error;
  const amount =
    loading || error || invalidCount !== 0
      ? null
      : count === 0
        ? 0
        : readCashFlowCurrency({
            amountMicros: totals.data?.plannedCashAmount?.SUM,
            currencyCode: 'KRW',
          });
  return {
    amount,
    filter,
    loading,
    error,
    hasInvalidAmount:
      !loading &&
      !error &&
      typeof count === 'number' &&
      typeof invalidCount === 'number' &&
      amount === null,
    refetch: () => Promise.all([totals.refetch(), invalidCurrencies.refetch()]),
  };
};
