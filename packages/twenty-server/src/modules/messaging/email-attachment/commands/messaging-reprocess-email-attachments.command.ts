import { Command, CommandRunner, Option } from 'nest-commander';

import { MessagingEmailAttachmentService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment.service';

type MessagingReprocessEmailAttachmentsCommandOptions = {
  messageId: string;
  workspaceId: string;
};

@Command({
  name: 'messaging:reprocess-email-attachments',
  description:
    'Re-fetch and persist email attachments for an existing message',
})
export class MessagingReprocessEmailAttachmentsCommand extends CommandRunner {
  constructor(
    private readonly messagingEmailAttachmentService: MessagingEmailAttachmentService,
  ) {
    super();
  }

  async run(
    _passedParam: string[],
    options: MessagingReprocessEmailAttachmentsCommandOptions,
  ): Promise<void> {
    await this.messagingEmailAttachmentService.reprocessAttachmentsForMessage({
      workspaceId: options.workspaceId,
      messageId: options.messageId,
    });
  }

  @Option({
    flags: '-m, --message-id [message_id]',
    description: 'Message ID',
    required: true,
  })
  parseMessageId(value: string): string {
    return value;
  }

  @Option({
    flags: '-w, --workspace-id [workspace_id]',
    description: 'Workspace ID',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }
}
