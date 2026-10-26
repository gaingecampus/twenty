import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { type RecordGqlOperationFindManyResult } from '@/object-record/graphql/types/RecordGqlOperationFindManyResult';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useQuery } from '@apollo/client/react';
import {
  type RecordGqlOperationVariables,
  type RecordGqlOperationGqlRecordFields,
} from 'twenty-shared/types';

export const useMessageListRecordPage = <T extends ObjectRecord>({
  objectNameSingular,
  filter,
  recordGqlFields,
  page,
  pageSize,
  skip = false,
}: {
  objectNameSingular: string;
  filter?: RecordGqlOperationVariables['filter'];
  recordGqlFields: RecordGqlOperationGqlRecordFields;
  page: number;
  pageSize: number;
  skip?: boolean;
}) => {
  const client = useApolloCoreClient();
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const { canReadObjectRecords } = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );
  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular,
    recordGqlFields,
  });
  const { data, loading, error, refetch } =
    useQuery<RecordGqlOperationFindManyResult>(findManyRecordsQuery, {
      client,
      skip: skip || !canReadObjectRecords,
      variables: {
        filter,
        orderBy: [{ createdAt: 'DescNullsLast' }, { id: 'AscNullsLast' }],
        limit: pageSize,
        offset: page * pageSize,
      },
      fetchPolicy: 'no-cache',
    });
  const connection =
    !loading && !error && !skip && canReadObjectRecords
      ? data?.[objectMetadataItem.namePlural]
      : undefined;
  return {
    records: connection
      ? getRecordsFromRecordConnection<T>({ recordConnection: connection })
      : [],
    totalCount:
      typeof connection?.totalCount === 'number' ? connection.totalCount : 0,
    objectMetadataItem,
    loading,
    error,
    refetch,
  };
};
