import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';

const SMS_AVAILABILITY = gql`
  query IsSmsDispatchAvailable {
    isSmsDispatchAvailable
  }
`;

export const useSmsDispatchAvailability = () => {
  const canManageWorkspace = useHasPermissionFlag(PermissionFlagType.WORKSPACE);
  const { data, loading, error } = useQuery<{
    isSmsDispatchAvailable: boolean;
  }>(SMS_AVAILABILITY, {
    skip: !canManageWorkspace,
    fetchPolicy: 'network-only',
  });
  return (
    canManageWorkspace &&
    !loading &&
    !error &&
    data?.isSmsDispatchAvailable === true
  );
};
