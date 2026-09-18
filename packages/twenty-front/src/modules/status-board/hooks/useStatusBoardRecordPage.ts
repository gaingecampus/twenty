import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { type RecordGqlOperationFindManyResult } from '@/object-record/graphql/types/RecordGqlOperationFindManyResult';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import {
  countStatusBoardDummyRecords,
  queryStatusBoardDummyRecords,
} from '@/status-board/utils/queryStatusBoardDummyDataset';
import { useQuery } from '@apollo/client/react';
import {
  type RecordGqlOperationFilter,
  type RecordGqlOperationVariables,
} from 'twenty-shared/types';

// Each page is fetched on its own with offset so any page can be opened
// directly. Cursor-based "load more" accumulated pages in the shared cache and
// could leave later pages empty while the total still promised them.
export const useStatusBoardRecordPage = ({
  objectNameSingular,
  filter,
  orderBy,
  recordGqlFields,
  page,
  pageSize,
  skip,
}: {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  orderBy?: RecordGqlOperationVariables['orderBy'];
  recordGqlFields: RecordGqlFields;
  page: number;
  pageSize: number;
  skip?: boolean;
}) => {
  const dummy = useStatusBoardDummyData();
  const { company } = useStatusBoardMetadata();
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const { canReadObjectRecords } = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );
  const apolloCoreClient = useApolloCoreClient();
  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular,
    recordGqlFields:
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
        : recordGqlFields,
  });
  const { data, previousData, loading, error, refetch } =
    useQuery<RecordGqlOperationFindManyResult>(findManyRecordsQuery, {
      skip: skip === true || dummy.enabled || !canReadObjectRecords,
      variables: { filter, orderBy, limit: pageSize, offset: page * pageSize },
      fetchPolicy: 'no-cache',
      client: apolloCoreClient,
    });

  if (dummy.enabled && skip !== true) {
    return {
      records: queryStatusBoardDummyRecords({
        dataset: dummy.dataset,
        objectNameSingular,
        filter,
        limit: (page + 1) * pageSize,
        orderBy,
      }).slice(page * pageSize),
      totalCount: countStatusBoardDummyRecords({
        dataset: dummy.dataset,
        objectNameSingular,
        filter,
      }),
      loading: false,
      error: undefined,
      refetch,
    };
  }

  // Keep the previous page visible while the next one loads.
  const connection = (data ?? previousData)?.[objectMetadataItem.namePlural];

  return {
    records: connection
      ? getRecordsFromRecordConnection({ recordConnection: connection })
      : [],
    totalCount:
      typeof connection?.totalCount === 'number' ? connection.totalCount : 0,
    loading,
    error,
    refetch,
  };
};
