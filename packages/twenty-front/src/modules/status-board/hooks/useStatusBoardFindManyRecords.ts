import { useState } from 'react';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import {
  countStatusBoardDummyRecords,
  queryStatusBoardDummyRecords,
} from '@/status-board/utils/queryStatusBoardDummyDataset';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const useStatusBoardFindManyRecords = ({
  objectNameSingular,
  filter,
  limit,
  recordGqlFields,
  skip,
}: {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  limit: number;
  recordGqlFields: RecordGqlFields;
  skip?: boolean;
}) => {
  const dummy = useStatusBoardDummyData();
  const queryKey = JSON.stringify({ objectNameSingular, filter, limit });
  const [pagination, setPagination] = useState({ queryKey, limit });
  const visibleLimit =
    pagination.queryKey === queryKey ? pagination.limit : limit;
  const shouldUseDummy = dummy.enabled && skip !== true;
  const { records, loading, hasNextPage, fetchMoreRecords } =
    useFindManyRecords({
      objectNameSingular,
      filter,
      limit,
      recordGqlFields,
      skip: skip === true || shouldUseDummy,
    });

  if (shouldUseDummy) {
    const dummyRecords = queryStatusBoardDummyRecords({
      dataset: dummy.dataset,
      objectNameSingular,
      filter,
      limit: visibleLimit,
    });
    const dummyCount = countStatusBoardDummyRecords({
      dataset: dummy.dataset,
      objectNameSingular,
      filter,
    });

    return {
      records: dummyRecords,
      loading: false,
      hasNextPage: dummyCount > dummyRecords.length,
      fetchMoreRecords: async () => {
        setPagination({ queryKey, limit: visibleLimit + limit });
      },
    };
  }

  return {
    records,
    loading,
    hasNextPage,
    fetchMoreRecords,
  };
};
