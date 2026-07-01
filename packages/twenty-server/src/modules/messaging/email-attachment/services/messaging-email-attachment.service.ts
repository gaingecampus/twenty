import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  ConnectedAccountProvider,
  FieldActorSource,
  FileFolder,
  MessageParticipantRole,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { FileStorageService } from 'src/engine/core-modules/file-storage/file-storage.service';
import { extractFileInfoOrThrow } from 'src/engine/core-modules/file/utils/extract-file-info-or-throw.utils';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { FilesFieldService } from 'src/engine/core-modules/file/files-field/services/files-field.service';
import { FileService } from 'src/engine/core-modules/file/services/file.service';
import { EMAIL_ATTACHMENT_FILE_FOLDERS } from 'src/engine/core-modules/tool/tools/email-tool/constants/email-attachment-file-folders.const';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { ATTACHMENT_KIND } from 'src/modules/messaging/email-attachment/constants/attachment-kind.constant';
import { MessagingEmailAttachmentPendingCacheService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment-pending-cache.service';
import { type EmailAttachmentPendingContext } from 'src/modules/messaging/email-attachment/types/email-attachment-pending-context.type';
import { GmailGetMessagesService } from 'src/modules/messaging/message-import-manager/drivers/gmail/services/gmail-get-messages.service';
import { GmailDownloadAttachmentService } from 'src/modules/messaging/message-import-manager/drivers/gmail/services/gmail-download-attachment.service';
import { ImapGetMessagesService } from 'src/modules/messaging/message-import-manager/drivers/imap/services/imap-get-messages.service';
import { MicrosoftGetMessagesService } from 'src/modules/messaging/message-import-manager/drivers/microsoft/services/microsoft-get-messages.service';
import { MicrosoftDownloadAttachmentService } from 'src/modules/messaging/message-import-manager/drivers/microsoft/services/microsoft-download-attachment.service';
import {
  extractDriveLinksFromMessageBodies,
  hasDriveLinksInMessageBody,
} from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/extract-drive-links-from-html.util';
import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message';
import { type MessageImportAttachment } from 'src/modules/messaging/message-import-manager/types/message';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { streamToBuffer } from 'src/utils/stream-to-buffer';

const MAX_EMAIL_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

@Injectable()
export class MessagingEmailAttachmentService {
  private readonly logger = new Logger(MessagingEmailAttachmentService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly filesFieldService: FilesFieldService,
    private readonly fileStorageService: FileStorageService,
    private readonly fileService: FileService,
    private readonly gmailDownloadAttachmentService: GmailDownloadAttachmentService,
    private readonly microsoftDownloadAttachmentService: MicrosoftDownloadAttachmentService,
    private readonly gmailGetMessagesService: GmailGetMessagesService,
    private readonly imapGetMessagesService: ImapGetMessagesService,
    private readonly microsoftGetMessagesService: MicrosoftGetMessagesService,
    private readonly messagingEmailAttachmentPendingCacheService: MessagingEmailAttachmentPendingCacheService,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectWorkspaceScopedRepository(FileEntity)
    private readonly fileRepository: WorkspaceScopedRepository<FileEntity>,
  ) {}

  hasTargetPersonsForPendingContext({
    participants,
    pendingContext,
  }: {
    participants: MessageParticipantWorkspaceEntity[];
    pendingContext: EmailAttachmentPendingContext;
  }): boolean {
    const direction =
      isDefined(pendingContext.outboundAttachmentFileIds) &&
      pendingContext.outboundAttachmentFileIds.length > 0
        ? MessageDirection.OUTGOING
        : pendingContext.direction;

    return (
      this.getTargetPersonIds({ participants, direction }).length > 0
    );
  }

  async persistAttachmentsForMessage({
    workspaceId,
    messageId,
    participants,
    pendingContext,
  }: {
    workspaceId: string;
    messageId: string;
    participants: MessageParticipantWorkspaceEntity[];
    pendingContext: EmailAttachmentPendingContext;
  }): Promise<boolean> {
    if (
      isDefined(pendingContext.outboundAttachmentFileIds) &&
      pendingContext.outboundAttachmentFileIds.length > 0
    ) {
      return this.promoteOutboundAttachments({
        workspaceId,
        messageId,
        participants,
        attachmentFileIds: pendingContext.outboundAttachmentFileIds,
      });
    }

    const targetPersonIds = this.getTargetPersonIds({
      participants,
      direction: pendingContext.direction,
    });

    if (targetPersonIds.length === 0) {
      return false;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const attachmentRepository =
          await this.globalWorkspaceOrmManager.getRepository<AttachmentWorkspaceEntity>(
            workspaceId,
            'attachment',
          );

        for (const attachment of pendingContext.attachments) {
          if (
            isDefined(attachment.size) &&
            attachment.size > MAX_EMAIL_ATTACHMENT_SIZE_BYTES
          ) {
            continue;
          }

          try {
            const fileBuffer = await this.downloadAttachmentBuffer({
              pendingContext,
              attachment,
            });

            if (!isDefined(fileBuffer)) {
              continue;
            }

            const emailExternalAttachmentId =
              attachment.externalId ?? attachment.filename;

            await this.createFileAttachmentsForPersons({
              workspaceId,
              messageId,
              attachmentRepository,
              targetPersonIds,
              filename: attachment.filename,
              fileBuffer,
              emailExternalAttachmentId,
            });
          } catch (error) {
            this.logger.warn(
              `Failed to persist MIME attachment ${attachment.externalId ?? attachment.filename} for message ${messageId}: ${error}`,
            );
          }
        }

        const driveLinks = extractDriveLinksFromMessageBodies({
          htmlBody: pendingContext.htmlBody,
          textBody: pendingContext.textBody,
        });

        if (driveLinks.length > 0) {
          for (const driveLink of driveLinks) {
            await this.createExternalLinkAttachmentsForPersons({
              workspaceId,
              attachmentRepository,
              targetPersonIds,
              messageId,
              externalUrl: driveLink.url,
              name: driveLink.label,
            });
          }
        }
      },
      authContext,
      { lite: true },
    );

    return true;
  }

  async promoteOutboundAttachments({
    workspaceId,
    messageId,
    participants,
    attachmentFileIds,
  }: {
    workspaceId: string;
    messageId: string;
    participants: MessageParticipantWorkspaceEntity[];
    attachmentFileIds: string[];
  }): Promise<boolean> {
    if (attachmentFileIds.length === 0) {
      return true;
    }

    const targetPersonIds = this.getTargetPersonIds({
      participants,
      direction: MessageDirection.OUTGOING,
    });

    if (targetPersonIds.length === 0) {
      return false;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const attachmentRepository =
          await this.globalWorkspaceOrmManager.getRepository<AttachmentWorkspaceEntity>(
            workspaceId,
            'attachment',
          );

        for (const fileId of attachmentFileIds) {
          const emailAttachmentFile = await this.fileRepository.findOne(
            workspaceId,
            {
              where: {
                id: fileId,
              },
            },
          );

          if (!isDefined(emailAttachmentFile)) {
            continue;
          }

          const fileStreamResult = await this.fileService.getFileStreamById({
            fileId,
            workspaceId,
            allowedFileFolders: EMAIL_ATTACHMENT_FILE_FOLDERS,
          });

          if (!isDefined(fileStreamResult)) {
            continue;
          }

          const fileBuffer = await streamToBuffer(fileStreamResult.stream);
          const filename =
            emailAttachmentFile.path.split('/').pop() ?? `file-${fileId}`;

          const savedFile = await this.filesFieldService.uploadFile({
            file: fileBuffer,
            filename,
            workspaceId,
            fieldMetadataUniversalIdentifier:
              STANDARD_OBJECTS.attachment.fields.file.universalIdentifier,
          });

          await this.fileStorageService.deleteByFileId({
            fileId,
            workspaceId,
            fileFolder: FileFolder.EmailAttachment,
          });

          for (const personId of targetPersonIds) {
            const isDuplicate = await attachmentRepository.findOne({
              where: {
                targetMessageId: messageId,
                targetPersonId: personId,
                emailExternalAttachmentId: fileId,
              },
            });

            if (isDefined(isDuplicate)) {
              continue;
            }

            await attachmentRepository.insert({
              name: filename,
              targetPersonId: personId,
              targetMessageId: messageId,
              emailExternalAttachmentId: fileId,
              attachmentKind: ATTACHMENT_KIND.FILE,
              externalUrl: null,
              file: await this.buildAttachmentFileValue({
                fileId: savedFile.id,
                filename,
                fileBuffer,
              }),
              createdBy: this.buildEmailCreatedBy(),
            });
          }
        }
      },
      authContext,
      { lite: true },
    );

    return true;
  }

  async reprocessAttachmentsForMessage({
    workspaceId,
    messageId,
  }: {
    workspaceId: string;
    messageId: string;
  }): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageChannelMessageAssociationRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
            workspaceId,
            'messageChannelMessageAssociation',
          );

        const messageParticipantRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageParticipantWorkspaceEntity>(
            workspaceId,
            'messageParticipant',
          );

        const messageChannelMessageAssociation =
          await messageChannelMessageAssociationRepository.findOne({
            where: {
              messageId,
            },
          });

        if (!isDefined(messageChannelMessageAssociation)) {
          this.logger.warn(
            `No message channel association found for message ${messageId}`,
          );

          return;
        }

        const messageChannel = await this.messageChannelRepository.findOne({
          where: {
            id: messageChannelMessageAssociation.messageChannelId,
            workspaceId,
          },
          relations: {
            connectedAccount: true,
            messageFolders: true,
          },
        });

        if (!isDefined(messageChannel?.connectedAccount)) {
          this.logger.warn(
            `No connected account found for message channel ${messageChannelMessageAssociation.messageChannelId}`,
          );

          return;
        }

        const participants = await messageParticipantRepository.find({
          where: {
            messageId,
          },
        });

        if (participants.length === 0) {
          this.logger.warn(`No participants found for message ${messageId}`);

          return;
        }

        if (
          !isNonEmptyString(messageChannelMessageAssociation.messageExternalId)
        ) {
          this.logger.warn(
            `No message external id found for message ${messageId}`,
          );

          return;
        }

        const importedMessages = await this.fetchImportedMessage({
          messageExternalId: messageChannelMessageAssociation.messageExternalId,
          connectedAccount: messageChannel.connectedAccount,
          messageChannel,
        });

        const importedMessage = importedMessages[0];

        if (!isDefined(importedMessage)) {
          this.logger.warn(
            `Could not fetch Gmail message ${messageChannelMessageAssociation.messageExternalId}`,
          );

          return;
        }

        const hasMimeAttachments = importedMessage.attachments.length > 0;
        const hasHtmlBody = isDefined(importedMessage.htmlBody);
        const hasDriveLinks = hasDriveLinksInMessageBody({
          htmlBody: importedMessage.htmlBody,
          textBody: importedMessage.text,
        });

        if (!hasMimeAttachments && !hasHtmlBody && !hasDriveLinks) {
          this.logger.warn(
            `Message ${messageId} has no attachments to process`,
          );

          return;
        }

        const pendingContext: EmailAttachmentPendingContext = {
          messageExternalId: importedMessage.externalId,
          connectedAccountId: messageChannel.connectedAccount.id,
          connectedAccountProvider: messageChannel.connectedAccount.provider,
          direction: importedMessage.direction,
          attachments: importedMessage.attachments,
          htmlBody: importedMessage.htmlBody,
          textBody: importedMessage.text,
        };

        await this.messagingEmailAttachmentPendingCacheService.setPendingContext(
          {
            workspaceId,
            messageId,
            context: pendingContext,
          },
        );

        const didPersist = await this.persistAttachmentsForMessage({
          workspaceId,
          messageId,
          participants,
          pendingContext,
        });

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

  private async fetchImportedMessage({
    messageExternalId,
    connectedAccount,
    messageChannel,
  }: {
    messageExternalId: string;
    connectedAccount: Pick<
      ConnectedAccountEntity,
      'id' | 'provider' | 'handle' | 'handleAliases'
    >;
    messageChannel: Pick<
      MessageChannelEntity,
      'messageFolders' | 'messageFolderImportPolicy'
    >;
  }): Promise<MessageWithParticipants[]> {
    switch (connectedAccount.provider) {
      case ConnectedAccountProvider.GOOGLE:
        return this.gmailGetMessagesService.getMessages(
          [messageExternalId],
          connectedAccount,
          messageChannel,
        );
      case ConnectedAccountProvider.MICROSOFT:
        return this.microsoftGetMessagesService.getMessages(
          [messageExternalId],
          connectedAccount,
        );
      case ConnectedAccountProvider.IMAP_SMTP_CALDAV:
        return this.imapGetMessagesService.getMessages(
          [messageExternalId],
          connectedAccount,
        );
      default:
        this.logger.warn(
          `Unsupported provider for email attachment reprocess: ${connectedAccount.provider}`,
        );

        return [];
    }
  }

  private async buildAttachmentFileValue({
    fileId,
    filename,
    fileBuffer,
  }: {
    fileId: string;
    filename: string;
    fileBuffer: Buffer;
  }) {
    const { ext } = await extractFileInfoOrThrow({
      file: fileBuffer,
      filename,
    });

    return [
      {
        fileId,
        label: filename,
        extension: ext ?? '',
      },
    ];
  }

  private buildEmailCreatedBy() {
    return {
      source: FieldActorSource.EMAIL,
      name: 'Email',
      workspaceMemberId: null,
      context: {},
    };
  }

  private async downloadAttachmentBuffer({
    pendingContext,
    attachment,
  }: {
    pendingContext: EmailAttachmentPendingContext;
    attachment: MessageImportAttachment;
  }): Promise<Buffer | null> {
    if (isNonEmptyString(attachment.inlineContentBase64)) {
      return Buffer.from(attachment.inlineContentBase64, 'base64');
    }

    if (!isNonEmptyString(attachment.externalId)) {
      return null;
    }

    if (
      pendingContext.connectedAccountProvider ===
      ConnectedAccountProvider.MICROSOFT
    ) {
      return this.microsoftDownloadAttachmentService.downloadAttachment({
        connectedAccountId: pendingContext.connectedAccountId,
        messageExternalId: pendingContext.messageExternalId,
        attachmentExternalId: attachment.externalId,
      });
    }

    return this.gmailDownloadAttachmentService.downloadAttachment({
      connectedAccountId: pendingContext.connectedAccountId,
      messageExternalId: pendingContext.messageExternalId,
      attachmentExternalId: attachment.externalId,
    });
  }

  private getTargetPersonIds({
    participants,
    direction,
  }: {
    participants: MessageParticipantWorkspaceEntity[];
    direction: MessageDirection;
  }): string[] {
    const roles =
      direction === MessageDirection.INCOMING
        ? [MessageParticipantRole.FROM]
        : [MessageParticipantRole.TO, MessageParticipantRole.CC];

    return [
      ...new Set(
        participants
          .filter(
            (participant) =>
              roles.includes(participant.role) &&
              isDefined(participant.personId),
          )
          .map((participant) => participant.personId as string),
      ),
    ];
  }

  private async createFileAttachmentsForPersons({
    workspaceId,
    messageId,
    attachmentRepository,
    targetPersonIds,
    filename,
    fileBuffer,
    emailExternalAttachmentId,
  }: {
    workspaceId: string;
    messageId: string;
    attachmentRepository: Awaited<
      ReturnType<GlobalWorkspaceOrmManager['getRepository']>
    >;
    targetPersonIds: string[];
    filename: string;
    fileBuffer: Buffer;
    emailExternalAttachmentId: string;
  }): Promise<void> {
    const savedFile = await this.filesFieldService.uploadFile({
      file: fileBuffer,
      filename,
      workspaceId,
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECTS.attachment.fields.file.universalIdentifier,
    });

    for (const personId of targetPersonIds) {
      const isDuplicate = await attachmentRepository.findOne({
        where: {
          targetMessageId: messageId,
          targetPersonId: personId,
          emailExternalAttachmentId,
        },
      });

      if (isDefined(isDuplicate)) {
        continue;
      }

      await attachmentRepository.insert({
        name: filename,
        targetPersonId: personId,
        targetMessageId: messageId,
        emailExternalAttachmentId,
        attachmentKind: ATTACHMENT_KIND.FILE,
        externalUrl: null,
        file: await this.buildAttachmentFileValue({
          fileId: savedFile.id,
          filename,
          fileBuffer,
        }),
        createdBy: this.buildEmailCreatedBy(),
      });
    }
  }

  private async createExternalLinkAttachmentsForPersons({
    workspaceId,
    attachmentRepository,
    targetPersonIds,
    messageId,
    externalUrl,
    name,
  }: {
    workspaceId: string;
    attachmentRepository: Awaited<
      ReturnType<GlobalWorkspaceOrmManager['getRepository']>
    >;
    targetPersonIds: string[];
    messageId: string;
    externalUrl: string;
    name: string;
  }): Promise<void> {
    for (const personId of targetPersonIds) {
      const isDuplicate = await attachmentRepository.findOne({
        where: {
          targetMessageId: messageId,
          targetPersonId: personId,
          externalUrl,
        },
      });

      if (isDefined(isDuplicate)) {
        continue;
      }

      await attachmentRepository.insert({
        name,
        targetPersonId: personId,
        targetMessageId: messageId,
        emailExternalAttachmentId: null,
        attachmentKind: ATTACHMENT_KIND.EXTERNAL_LINK,
        externalUrl,
        file: null,
        createdBy: this.buildEmailCreatedBy(),
      });
    }
  }
}
