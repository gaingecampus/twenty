import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { MAX_SEARCH_RESULTS } from '@/command-menu/constants/MaxSearchResults';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useDoObjectMetadataItemsExist } from '@/object-metadata/hooks/useDoObjectMetadataItemsExist';
import { useSnackBarOnQueryError } from '@/apollo/hooks/useSnackBarOnQueryError';
import { type WatchQueryFetchPolicy } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';
import {
  type ObjectRecordFilterInput,
  SearchDocument,
} from '~/generated/graphql';

// maybe we should look at ObjectMetadataItemIdentifier to update the API even though there are many location to update
export type UseSearchRecordsParams = {
  objectNameSingulars: string[];
  limit?: number;
  onError?: (error?: Error) => void;
  skip?: boolean;
  fetchPolicy?: WatchQueryFetchPolicy;
  searchInput?: string;
  filter?: ObjectRecordFilterInput;
};

export const useObjectRecordSearchRecords = ({
  objectNameSingulars,
  searchInput,
  limit,
  skip,
  filter,
  fetchPolicy,
}: UseSearchRecordsParams) => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const areDefined = useDoObjectMetadataItemsExist(objectNameSingulars);

  const apolloCoreClient = useApolloCoreClient();

  const { data, loading, error, previousData } = useQuery(SearchDocument, {
    skip:
      skip || !areDefined || !currentWorkspaceMember || !isDefined(searchInput),
    variables: {
      searchInput: searchInput ?? '',
      limit: limit ?? MAX_SEARCH_RESULTS,
      filter: filter ?? {},
      includedObjectNameSingulars: objectNameSingulars,
    },
    fetchPolicy: fetchPolicy,
    client: apolloCoreClient,
  });

  useSnackBarOnQueryError(error);

  const effectiveData = loading ? previousData : data;

  const searchRecords = useMemo(
    () => effectiveData?.search?.edges?.map((edge) => edge.node) || [],
    [effectiveData],
  );

  const { objectMetadataItems } = useObjectMetadataItems();
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const memberMetadata = objectMetadataItems.find(
    (item) =>
      ['teamMember', 'member'].includes(item.nameSingular) &&
      item.fields.some((field) => field.name === 'workspaceMemberAccountId'),
  );
  const memberIds = searchRecords
    .filter(
      (record) => record.objectNameSingular === memberMetadata?.nameSingular,
    )
    .map((record) => record.recordId);
  const linkedRecords = useFindManyRecords({
    objectNameSingular: memberMetadata?.nameSingular ?? 'workspaceMember',
    skip: !memberMetadata || memberIds.length === 0,
    filter: { id: { in: memberIds } },
    recordGqlFields: memberMetadata
      ? { id: true, workspaceMemberAccountId: true }
      : { id: true },
    limit: memberIds.length || 1,
  });
  const profiledSearchRecords = useMemo(
    () =>
      searchRecords.map((record) => {
        if (record.objectNameSingular !== memberMetadata?.nameSingular)
          return record;
        const linkedRecord = linkedRecords.records.find(
          (item) => item.id === record.recordId,
        );
        const account = currentWorkspaceMembers.find(
          (item) => item.id === linkedRecord?.workspaceMemberAccountId,
        );
        if (!account) return record;
        return {
          ...record,
          imageUrl: account.avatarUrl ?? '',
          label:
            [account.name.firstName, account.name.lastName]
              .filter(Boolean)
              .join(' ') || record.label,
        };
      }),
    [
      searchRecords,
      linkedRecords.records,
      currentWorkspaceMembers,
      memberMetadata?.nameSingular,
    ],
  );

  return {
    searchRecords: profiledSearchRecords,
    loading,
    error,
  };
};
