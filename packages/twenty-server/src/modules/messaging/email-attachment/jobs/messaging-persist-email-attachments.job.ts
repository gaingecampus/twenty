import { Scope } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { MessagingEmailAttachmentPendingCacheService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment-pending-cache.service';
import { MessagingEmailAttachmentService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment.service';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';

export type MessagingPersistEmailAttachmentsJobData = {
  workspaceId: string;
  messageId: string;
  participants: MessageParticipantWorkspaceEntity[];
};

@Processor({
  queueName: MessageQueue.messagingQueue,
  scope: Scope.REQUEST,
})
export class MessagingPersistEmailAttachmentsJob {
  constructor(
    private readonly messagingEmailAttachmentService: MessagingEmailAttachmentService,
    private readonly messagingEmailAttachmentPendingCacheService: MessagingEmailAttachmentPendingCacheService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  @Process(MessagingPersistEmailAttachmentsJob.name)
  async handle(data: MessagingPersistEmailAttachmentsJobData): Promise<void> {
    const { workspaceId, messageId, participants } = data;

    const pendingContext =
      await this.messagingEmailAttachmentPendingCacheService.getPendingContext({
        workspaceId,
        messageId,
      });

    if (!isDefined(pendingContext)) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const didPersist =
          await this.messagingEmailAttachmentService.persistAttachmentsForMessage(
            {
              workspaceId,
              messageId,
              participants,
              pendingContext,
            },
          );

        if (didPersist) {
          await this.messagingEmailAttachmentPendingCacheService.deletePendingContext(
            {
              workspaceId,
              messageId,
            },
          );
        }
      },
      authContext,
      { lite: true },
    );
  }
}
