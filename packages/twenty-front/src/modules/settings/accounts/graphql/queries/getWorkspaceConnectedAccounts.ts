import { gql } from '@apollo/client';

export const GET_WORKSPACE_CONNECTED_ACCOUNTS = gql`
  query WorkspaceConnectedAccounts {
    workspaceConnectedAccounts {
      id
      handle
      provider
      visibility
      userWorkspaceId
      ownerEmail
      ownerFirstName
      ownerLastName
      ownerAvatarUrl
      syncStatus
      messageChannelId
      messageCount
      syncedAt
      authFailedAt
      archivedAt
      createdAt
    }
  }
`;
