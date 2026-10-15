import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

export type MailboxMessage = {
  id: string;
  subject: string | null;
  text: string | null;
  receivedAt: string | null;
  participants: {
    role: string;
    handle: string | null;
    displayName: string | null;
  }[];
};

const MAILBOX_MESSAGES = gql`
  query MyMailboxMessages($channelId: UUID!, $folderId: UUID, $page: Int!) {
    myMailboxMessages(channelId: $channelId, folderId: $folderId, page: $page) {
      messages {
        id
        subject
        text
        receivedAt
        participants {
          role
          handle
          displayName
        }
      }
      hasMore
    }
  }
`;

export const useMailboxMessages = (
  channelId: string,
  folderId: string | null,
  page: number,
) =>
  useQuery<{
    myMailboxMessages: { messages: MailboxMessage[]; hasMore: boolean };
  }>(MAILBOX_MESSAGES, {
    variables: { channelId, folderId, page },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
