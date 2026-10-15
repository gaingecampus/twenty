import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

type MailboxFolder = {
  id: string;
  name: string | null;
  isSynced: boolean;
};

const MAILBOX_FOLDERS = gql`
  query MyMailboxFolders($channelId: UUID!) {
    myMailboxFolders(channelId: $channelId) {
      id
      name
      isSynced
    }
  }
`;

export const useMailboxFolders = (channelId: string) => {
  const result = useQuery<{ myMailboxFolders: MailboxFolder[] }>(
    MAILBOX_FOLDERS,
    { variables: { channelId } },
  );

  return { ...result, messageFolders: result.data?.myMailboxFolders ?? [] };
};
