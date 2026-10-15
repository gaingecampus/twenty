import { type MessageChannel } from '@/accounts/types/MessageChannel';
import {
  MessageChannelSyncStage,
  MessageChannelType,
} from 'twenty-shared/types';

export const getConfiguredEmailChannels = (channels: MessageChannel[]) =>
  channels.filter(
    (channel) =>
      channel.type === MessageChannelType.EMAIL &&
      channel.isSyncEnabled &&
      channel.syncStage !== MessageChannelSyncStage.PENDING_CONFIGURATION &&
      Boolean(channel.connectedAccount?.handle.trim()),
  );
