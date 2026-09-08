import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { useState } from 'react';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import {
  countStatusBoardDummyRecords,
  queryStatusBoardDummyRecords,
} from '@/status-board/utils/queryStatusBoardDummyDataset';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import {
  type RecordGqlOperationVariables,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

export const useStatusBoardFindManyRecords = ({
  objectNameSingular,
  filter,
  limit,
  recordGqlFields,
  skip,
  orderBy,
}: {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  limit: number;
  recordGqlFields: RecordGqlFields;
  skip?: boolean;
  orderBy?: RecordGqlOperationVariables['orderBy'];
}) => {
  const dummy = useStatusBoardDummyData();
  const { company } = useStatusBoardMetadata();
  const fieldsWithCompanyAvatar =
    company && typeof recordGqlFields.company === 'object'
      ? {
          ...recordGqlFields,
          company: {
            ...recordGqlFields.company,
            ...buildStatusBoardRecordGqlFields({
              objectMetadataItem: company,
              fieldNames: ['name', 'domainName'],
            }),
          },
        }
      : recordGqlFields;
  const queryKey = JSON.stringify({
    objectNameSingular,
    filter,
    limit,
    orderBy,
  });
  const [pagination, setPagination] = useState({ queryKey, limit });
  const visibleLimit =
    pagination.queryKey === queryKey ? pagination.limit : limit;
  const shouldUseDummy = dummy.enabled && skip !== true;
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } =
    useFindManyRecords({
      objectNameSingular,
      filter,
      orderBy,
      limit,
      recordGqlFields: fieldsWithCompanyAvatar,
      skip: skip === true || shouldUseDummy,
    });

  if (shouldUseDummy) {
    const dummyRecords = queryStatusBoardDummyRecords({
      dataset: dummy.dataset,
      objectNameSingular,
      filter,
      limit: visibleLimit,
      orderBy,
    });
    const dummyCount = countStatusBoardDummyRecords({
      dataset: dummy.dataset,
      objectNameSingular,
      filter,
    });

    return {
      records: dummyRecords,
      loading: false,
      error: undefined,
      refetch,
      hasNextPage: dummyCount > dummyRecords.length,
      fetchMoreRecords: async () => {
        setPagination({ queryKey, limit: visibleLimit + limit });
      },
    };
  }

  return {
    records,
    error,
    refetch,
    loading,
    hasNextPage,
    fetchMoreRecords,
  };
};
