import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION } from 'twenty-shared/constants';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const useStatusBoardCount = ({
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
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
  });

  const count = data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;

  return {
    count: typeof count === 'number' ? count : 0,
    loading,
  };
};
