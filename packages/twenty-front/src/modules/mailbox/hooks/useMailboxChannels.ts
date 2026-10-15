import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

export const MAILBOX_CHANNELS = gql`
  query MyPersonalMailboxChannels {
    myPersonalMailboxChannels {
      id
      handle
      isSyncEnabled
      syncStatus
      syncStage
    }
  }
`;

export type MailboxChannel = {
  id: string;
  handle: string;
  isSyncEnabled: boolean;
  syncStatus: string;
  syncStage: string;
};

export const useMailboxChannels = () => {
  const result = useQuery<{ myPersonalMailboxChannels: MailboxChannel[] }>(
    MAILBOX_CHANNELS,
    { fetchPolicy: 'cache-and-network' },
  );
  const { pathname } = useLocation();
  const { refetch } = result;
  useEffect(() => {
    void refetch().catch(() => undefined);
  }, [pathname, refetch]);
  return { ...result, channels: result.data?.myPersonalMailboxChannels ?? [] };
};
