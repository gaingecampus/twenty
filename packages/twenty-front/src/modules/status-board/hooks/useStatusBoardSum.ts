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
  const { data, loading } = useAggregateRecords({
    objectNameSingular,
    filter,
    skip,
    recordGqlFieldsAggregate: {
      [STATUS_BOARD_FIELD.amount]: [AggregateOperations.SUM],
    },
  });

  const sum = data?.[STATUS_BOARD_FIELD.amount]?.SUM;

  return {
    sum: typeof sum === 'number' ? sum : undefined,
    loading,
  };
};
