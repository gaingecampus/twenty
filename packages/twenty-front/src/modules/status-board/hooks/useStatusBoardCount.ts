import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { countStatusBoardDummyRecords } from '@/status-board/utils/queryStatusBoardDummyDataset';
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
  const dummy = useStatusBoardDummyData();
  const shouldUseDummy = dummy.enabled && skip !== true;
  const { data, loading, error } = useAggregateRecords({
    objectNameSingular,
    filter,
    skip: skip === true || shouldUseDummy,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
  });

  if (shouldUseDummy) {
    return {
      count: countStatusBoardDummyRecords({
        dataset: dummy.dataset,
        objectNameSingular,
        filter,
      }),
      loading: false,
      error: undefined,
    };
  }

  const count = data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;

  return {
    count: typeof count === 'number' ? count : 0,
    loading,
    error,
  };
};
