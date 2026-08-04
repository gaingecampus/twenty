import { useQuery } from '@apollo/client/react';

import { GET_WORKSPACE_CONNECTED_ACCOUNTS } from '@/settings/accounts/graphql/queries/getWorkspaceConnectedAccounts';
import { type MessageChannelSyncStatus } from 'twenty-shared/types';

export type WorkspaceConnectedAccount = {
  id: string;
  handle: string;
  provider: string;
  visibility: string;
  userWorkspaceId: string;
  ownerEmail: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerAvatarUrl: string | null;
  syncStatus: MessageChannelSyncStatus | null;
  messageChannelId: string | null;
  messageCount: number;
  syncedAt: string | null;
  authFailedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export const useWorkspaceConnectedAccounts = () => {
  const { data, loading } = useQuery<{
    workspaceConnectedAccounts: WorkspaceConnectedAccount[];
  }>(GET_WORKSPACE_CONNECTED_ACCOUNTS);

  return {
    accounts: data?.workspaceConnectedAccounts ?? [],
    loading,
  };
};
