import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { OnCustomBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-custom-batch-event.decorator';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { CustomWorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/custom-workspace-batch-event.type';
import { MessagingPersistEmailAttachmentsJob } from 'src/modules/messaging/email-attachment/jobs/messaging-persist-email-attachments.job';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';

@Injectable()
export class MessagingEmailAttachmentListener {
  constructor(
    @InjectMessageQueue(MessageQueue.messagingQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnCustomBatchEvent('messageParticipant_matched')
  public async handleMessageParticipantMatched(
    batchEvent: CustomWorkspaceEventBatch<{
      workspaceMemberId: string;
      participants: MessageParticipantWorkspaceEntity[];
    }>,
  ): Promise<void> {
    if (!isDefined(batchEvent.workspaceId)) {
      return;
    }

    const participantsByMessageId = new Map<
      string,
      MessageParticipantWorkspaceEntity[]
    >();

    for (const event of batchEvent.events) {
      for (const participant of event.participants ?? []) {
        if (!isDefined(participant.messageId)) {
          continue;
        }

        const existingParticipants =
          participantsByMessageId.get(participant.messageId) ?? [];

        existingParticipants.push(participant);
        participantsByMessageId.set(participant.messageId, existingParticipants);
      }
    }

    for (const [messageId, participants] of participantsByMessageId) {
      await this.messageQueueService.add(
        MessagingPersistEmailAttachmentsJob.name,
        {
          workspaceId: batchEvent.workspaceId,
          messageId,
          participants,
        },
      );
    }
  }
}
