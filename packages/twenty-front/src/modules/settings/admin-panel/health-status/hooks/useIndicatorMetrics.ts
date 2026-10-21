import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';
import { useQuery } from '@apollo/client/react';
import {
  GetIndicatorHealthStatusDocument,
  type HealthIndicatorId,
} from '~/generated-admin/graphql';

export const useIndicatorMetrics = (
  indicatorId: HealthIndicatorId,
  polling: boolean,
  enabled: boolean,
) => {
  const client = useApolloAdminClient();

  return useQuery(GetIndicatorHealthStatusDocument, {
    client,
    variables: { indicatorId },
    skip: !enabled,
    fetchPolicy: 'network-only',
    pollInterval: polling ? 15_000 : 0,
    skipPollAttempt: () => document.visibilityState !== 'visible',
    notifyOnNetworkStatusChange: true,
  });
};
