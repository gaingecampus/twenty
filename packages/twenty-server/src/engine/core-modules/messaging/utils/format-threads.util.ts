import { FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

import { MessageChannelVisibility } from 'twenty-shared/types';
import { type TimelineThreadDTO } from 'src/engine/core-modules/messaging/dtos/timeline-thread.dto';
import { extractParticipantSummary } from 'src/engine/core-modules/messaging/utils/extract-participant-summary.util';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';

export const formatThreads = (
  threads: Omit<
    TimelineThreadDTO,
    | 'firstParticipant'
    | 'lastTwoParticipants'
    | 'participantCount'
    | 'read'
    | 'visibility'
    | 'hasAttachments'
  >[],
  threadParticipantsByThreadId: {
    [key: string]: MessageParticipantWorkspaceEntity[];
  },
  threadVisibilityByThreadId: {
    [key: string]: MessageChannelVisibility;
  },
  threadHasAttachmentsByThreadId: {
    [key: string]: boolean;
  },
): TimelineThreadDTO[] => {
  return threads
    .filter((thread) => isDefined(threadParticipantsByThreadId[thread.id]))
    .map((thread) => {
      const visibility =
        threadVisibilityByThreadId[thread.id] ??
        MessageChannelVisibility.METADATA;

      return {
        ...thread,
        subject:
          visibility === MessageChannelVisibility.SHARE_EVERYTHING ||
          visibility === MessageChannelVisibility.SUBJECT
            ? thread.subject
            : FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED,
        lastMessageBody:
          visibility === MessageChannelVisibility.SHARE_EVERYTHING
            ? thread.lastMessageBody
            : FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED,
        hasAttachments:
          visibility === MessageChannelVisibility.SHARE_EVERYTHING &&
          (threadHasAttachmentsByThreadId[thread.id] ?? false),
        ...extractParticipantSummary(threadParticipantsByThreadId[thread.id]),
        visibility,
        read: true,
      };
    });
};
