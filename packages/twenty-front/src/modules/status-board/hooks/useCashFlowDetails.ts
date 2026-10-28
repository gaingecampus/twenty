import { getCashFlowToday } from '@/status-board/utils/getCashFlowToday';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { readCashFlowCurrency } from '@/status-board/utils/calculateCashFlow';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION } from 'twenty-shared/constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const getCashFlowDetailsFilters = (
  sourceHash: string,
  today = getCashFlowToday(),
) => ({
  transactions: {
    bankKey: { in: ['shinhan', 'kb', 'nh'] },
  } as RecordGqlOperationFilter,
  receipts: {
    and: [
      { sourceHash: { eq: sourceHash } },
      { inclusionStatus: { eq: '포함' } },
      { expectedDate: { gte: today } },
    ],
  } as RecordGqlOperationFilter,
});

// Earlier months stay unchanged when importing the current month onward.
// The latest retained transaction supplies the balance for an inactive bank.
const useLatestBankTransaction = (bankKey: string) => {
  const result = useFindManyRecords({
    objectNameSingular: 'bankTransaction',
    filter: {
      bankKey: { eq: bankKey },
    },
    limit: 2,
    orderBy: [{ transactionAt: 'DescNullsLast' }, { id: 'AscNullsLast' }],
    recordGqlFields: {
      id: true,
      transactionAt: true,
      balance: { amountMicros: true, currencyCode: true },
    },
  });
  const row = result.records.at(0);
  const second = result.records.at(1);
  const amount = readCashFlowCurrency(row?.balance);
  const ambiguous =
    second !== undefined &&
    row?.transactionAt === second.transactionAt &&
    amount !== readCashFlowCurrency(second.balance);
  return { ...result, row, amount: ambiguous ? null : amount };
};

export const useCashFlowDetails = (
  sourceHash: string,
  today = getCashFlowToday(),
) => {
  const filters = getCashFlowDetailsFilters(sourceHash, today);
  const shinhan = useLatestBankTransaction('shinhan');
  const kb = useLatestBankTransaction('kb');
  const nh = useLatestBankTransaction('nh');
  const incoming = useAggregateRecords({
    objectNameSingular: 'expectedReceipt',
    filter: filters.receipts,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
      outstandingAmount: [AggregateOperations.SUM],
    },
  });
  const invalid = useAggregateRecords({
    objectNameSingular: 'expectedReceipt',
    filter: {
      and: [
        filters.receipts,
        {
          or: [
            { outstandingAmount: { amountMicros: { is: 'NULL' } } },
            { outstandingAmount: { currencyCode: { is: 'NULL' } } },
            { outstandingAmount: { currencyCode: { neq: 'KRW' } } },
          ],
        },
      ],
    },
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
  });
  const loading =
    shinhan.loading ||
    kb.loading ||
    nh.loading ||
    incoming.loading ||
    invalid.loading;
  const error =
    shinhan.error ?? kb.error ?? nh.error ?? incoming.error ?? invalid.error;
  const count =
    incoming.data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  const invalidCount =
    invalid.data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  const incomingAmount =
    loading || error || invalidCount !== 0
      ? null
      : count === 0
        ? 0
        : readCashFlowCurrency({
            amountMicros: incoming.data?.outstandingAmount?.SUM,
            currencyCode: 'KRW',
          });
  return {
    filters,
    loading,
    error,
    incomingAmount,
    banks: [
      {
        name: '신한',
        amount: shinhan.amount,
        date: shinhan.row?.transactionAt,
      },
      { name: '국민', amount: kb.amount, date: kb.row?.transactionAt },
      { name: '농협', amount: nh.amount, date: nh.row?.transactionAt },
    ],
    refetch: () =>
      Promise.all([
        shinhan.refetch(),
        kb.refetch(),
        nh.refetch(),
        incoming.refetch(),
        invalid.refetch(),
      ]),
  };
};
