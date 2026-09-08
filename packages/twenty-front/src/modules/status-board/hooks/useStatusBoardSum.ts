import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { sumStatusBoardDummyAmount } from '@/status-board/utils/queryStatusBoardDummyDataset';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const useStatusBoardSum = ({
  objectNameSingular,
  filter,
  skip,
}: {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  skip?: boolean;
}) => {
  const dummy = useStatusBoardDummyData();
  const shouldUseDummy = dummy.enabled && skip !== true;
  const { data, loading, error } = useAggregateRecords({
    objectNameSingular,
    filter,
    skip: skip === true || shouldUseDummy,
    recordGqlFieldsAggregate: {
      [STATUS_BOARD_FIELD.amount]: [AggregateOperations.SUM],
    },
  });

  if (shouldUseDummy) {
    return {
      sum: sumStatusBoardDummyAmount({
        dataset: dummy.dataset,
        objectNameSingular,
        filter,
      }),
      loading: false,
      error: undefined,
    };
  }

  const sum = data?.[STATUS_BOARD_FIELD.amount]?.SUM;

  return {
    sum: typeof sum === 'number' ? sum : undefined,
    loading,
    error,
  };
};
