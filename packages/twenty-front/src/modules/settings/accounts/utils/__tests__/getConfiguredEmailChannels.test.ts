import { type MessageChannel } from '@/accounts/types/MessageChannel';
import { getConfiguredEmailChannels } from '@/settings/accounts/utils/getConfiguredEmailChannels';
import {
  MessageChannelContactAutoCreationPolicy,
  MessageChannelSyncStage,
  MessageChannelSyncStatus,
  MessageChannelType,
  MessageFolderImportPolicy,
} from 'twenty-shared/types';
import { MessageChannelVisibility } from '~/generated/graphql';

const emailChannel: MessageChannel = {
  id: 'channel',
  handle: 'sender@example.com',
  visibility: MessageChannelVisibility.SHARE_EVERYTHING,
  type: MessageChannelType.EMAIL,
  isContactAutoCreationEnabled: false,
  contactAutoCreationPolicy: MessageChannelContactAutoCreationPolicy.NONE,
  messageFolderImportPolicy: MessageFolderImportPolicy.ALL_FOLDERS,
  excludeNonProfessionalEmails: false,
  excludeGroupEmails: false,
  isSyncEnabled: true,
  syncStatus: MessageChannelSyncStatus.ACTIVE,
  syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
  syncStageStartedAt: null,
  connectedAccountId: 'account',
  connectedAccount: { id: 'account', handle: 'sender@example.com' },
  createdAt: '',
  updatedAt: '',
  __typename: 'MessageChannel',
};

describe('getConfiguredEmailChannels', () => {
  it('keeps connected email accounts while excluding forwarding channels and unfinished connections', () => {
    const channels: MessageChannel[] = [
      emailChannel,
      { ...emailChannel, id: 'group', type: MessageChannelType.EMAIL_GROUP },
      { ...emailChannel, id: 'disabled', isSyncEnabled: false },
      {
        ...emailChannel,
        id: 'pending',
        syncStage: MessageChannelSyncStage.PENDING_CONFIGURATION,
      },
      { ...emailChannel, id: 'removed', connectedAccount: null },
      {
        ...emailChannel,
        id: 'empty',
        connectedAccount: { id: 'empty-account', handle: ' ' },
      },
    ];

    expect(getConfiguredEmailChannels(channels)).toEqual([emailChannel]);
  });

  it('does not hide a configured account solely because receiving sync failed', () => {
    const channel = {
      ...emailChannel,
      syncStage: MessageChannelSyncStage.FAILED,
      syncStatus: MessageChannelSyncStatus.FAILED_UNKNOWN,
    };

    expect(getConfiguredEmailChannels([channel])).toEqual([channel]);
  });
});
