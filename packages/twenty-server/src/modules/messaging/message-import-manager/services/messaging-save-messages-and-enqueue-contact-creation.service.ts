import { Injectable } from '@nestjs/common';

import {
  FieldActorSource,
  MessageChannelContactAutoCreationPolicy,
  MessageParticipantRole,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEntityManager } from 'src/engine/twenty-orm/entity-manager/workspace-entity-manager';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import {
  CreateCompanyAndContactJob,
  type CreateCompanyAndContactJobData,
} from 'src/modules/contact-creation-manager/jobs/create-company-and-contact.job';
import {
  type Participant,
  type ParticipantWithMessageId,
} from 'src/modules/messaging/message-import-manager/drivers/gmail/types/gmail-message.type';
import {
  type MessageChannelMessageAssociationFolderAssociation,
  MessagingMessageFolderAssociationService,
} from 'src/modules/messaging/message-import-manager/services/messaging-message-folder-association.service';
import { MessagingMessageService } from 'src/modules/messaging/message-import-manager/services/messaging-message.service';
import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message';
import { MessagingMessageParticipantService } from 'src/modules/messaging/message-participant-manager/services/messaging-message-participant.service';
import { MessagingEmailAttachmentPendingCacheService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment-pending-cache.service';
import { MessagingEmailAttachmentService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment.service';
import { MessagingPersistEmailAttachmentsJob } from 'src/modules/messaging/email-attachment/jobs/messaging-persist-email-attachments.job';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { hasDriveLinksInMessageBody } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/extract-drive-links-from-html.util';
import { isWorkEmail } from 'src/utils/is-work-email';

@Injectable()
export class MessagingSaveMessagesAndEnqueueContactCreationService {
  constructor(
    @InjectMessageQueue(MessageQueue.contactCreationQueue)
    private readonly messageQueueService: MessageQueueService,
    @InjectMessageQueue(MessageQueue.messagingQueue)
    private readonly messagingQueueService: MessageQueueService,
    private readonly messageService: MessagingMessageService,
    private readonly messageParticipantService: MessagingMessageParticipantService,
    private readonly messageFolderAssociationService: MessagingMessageFolderAssociationService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly messagingEmailAttachmentPendingCacheService: MessagingEmailAttachmentPendingCacheService,
    private readonly messagingEmailAttachmentService: MessagingEmailAttachmentService,
  ) {}

  async saveMessagesAndEnqueueContactCreation(
    messagesToSave: MessageWithParticipants[],
    messageChannel: MessageChannelEntity,
    connectedAccount: ConnectedAccountEntity,
    workspaceId: string,
    options?: {
      outboundAttachmentFileIds?: string[];
    },
  ) {
    const handleAliases = connectedAccount.handleAliases || [];
    const authContext = buildSystemAuthContext(workspaceId);
    let messageIdsWithPendingAttachments: string[] = [];

    const participantsWithMessageId =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const workspaceDataSource =
            await this.globalWorkspaceOrmManager.getGlobalWorkspaceDataSource();

          return workspaceDataSource?.transaction(
            async (transactionManager: WorkspaceEntityManager) => {
              const {
                messageExternalIdsAndIdsMap,
                messageExternalIdToMessageChannelMessageAssociationIdMap,
              } = await this.messageService.saveMessagesWithinTransaction(
                messagesToSave,
                messageChannel.id,
                transactionManager,
                workspaceId,
              );

              const participantsWithMessageId: (ParticipantWithMessageId & {
                shouldCreateContact: boolean;
              })[] = messagesToSave.flatMap((message) => {
                const messageId = messageExternalIdsAndIdsMap.get(
                  message.externalId,
                );

                return messageId
                  ? message.participants.map((participant: Participant) => {
                      const fromHandle =
                        message.participants.find(
                          (p) => p.role === MessageParticipantRole.FROM,
                        )?.handle || '';

                      const isMessageSentByConnectedAccount =
                        handleAliases.includes(fromHandle) ||
                        fromHandle === connectedAccount.handle;

                      const isParticipantConnectedAccount =
                        handleAliases.includes(participant.handle) ||
                        participant.handle === connectedAccount.handle;

                      const isExcludedByNonProfessionalEmails =
                        messageChannel.excludeNonProfessionalEmails &&
                        !isWorkEmail(participant.handle);

                      const shouldCreateContact =
                        !!participant.handle &&
                        !isParticipantConnectedAccount &&
                        !isExcludedByNonProfessionalEmails &&
                        (messageChannel.contactAutoCreationPolicy ===
                          MessageChannelContactAutoCreationPolicy.SENT_AND_RECEIVED ||
                          (messageChannel.contactAutoCreationPolicy ===
                            MessageChannelContactAutoCreationPolicy.SENT &&
                            isMessageSentByConnectedAccount));

                      return {
                        ...participant,
                        messageId,
                        shouldCreateContact,
                      };
                    })
                  : [];
              });

              const pendingAttachmentMessageIds: string[] = [];

              for (const message of messagesToSave) {
                const messageId = messageExternalIdsAndIdsMap.get(
                  message.externalId,
                );

                if (!isDefined(messageId)) {
                  continue;
                }

                const outboundAttachmentFileIds =
                  options?.outboundAttachmentFileIds ?? [];

                if (outboundAttachmentFileIds.length > 0) {
                  await this.messagingEmailAttachmentPendingCacheService.setPendingContext(
                    {
                      workspaceId,
                      messageId,
                      context: {
                        messageExternalId: message.externalId,
                        connectedAccountId: connectedAccount.id,
                        connectedAccountProvider: connectedAccount.provider,
                        direction: message.direction,
                        attachments: [],
                        outboundAttachmentFileIds,
                      },
                    },
                  );
                  pendingAttachmentMessageIds.push(messageId);

                  continue;
                }

                const hasMimeAttachments = message.attachments.length > 0;
                const hasHtmlBody = isDefined(message.htmlBody);
                const hasDriveLinks = hasDriveLinksInMessageBody({
                  htmlBody: message.htmlBody,
                  textBody: message.text,
                });

                if (!hasMimeAttachments && !hasHtmlBody && !hasDriveLinks) {
                  continue;
                }

                await this.messagingEmailAttachmentPendingCacheService.setPendingContext(
                  {
                    workspaceId,
                    messageId,
                    context: {
                      messageExternalId: message.externalId,
                      connectedAccountId: connectedAccount.id,
                      connectedAccountProvider: connectedAccount.provider,
                      direction: message.direction,
                      attachments: message.attachments,
                      htmlBody: message.htmlBody,
                      textBody: message.text,
                    },
                  },
                );
                pendingAttachmentMessageIds.push(messageId);
              }

              await this.messageParticipantService.saveMessageParticipants(
                participantsWithMessageId,
                workspaceId,
                transactionManager,
              );

              const folderAssociations: MessageChannelMessageAssociationFolderAssociation[] =
                messagesToSave.flatMap((message) => {
                  const messageFolderIds = message.messageFolderIds ?? [];

                  if (messageFolderIds.length === 0) {
                    return [];
                  }

                  const associationId =
                    messageExternalIdToMessageChannelMessageAssociationIdMap.get(
                      message.externalId,
                    );

                  if (!isDefined(associationId)) {
                    return [];
                  }

                  return [
                    {
                      messageChannelMessageAssociationId: associationId,
                      messageFolderIds,
                    },
                  ];
                });

              await this.messageFolderAssociationService.saveMessageFolderAssociations(
                folderAssociations,
                workspaceId,
                transactionManager,
              );

              messageIdsWithPendingAttachments = pendingAttachmentMessageIds;

              return participantsWithMessageId;
            },
          );
        },
        authContext,
        { lite: true },
      );

    await this.enqueueEmailAttachmentPersistJobs({
      workspaceId,
      messageIds: messageIdsWithPendingAttachments,
    });

    if (
      messageChannel.isContactAutoCreationEnabled &&
      participantsWithMessageId
    ) {
      const contactsToCreate = participantsWithMessageId.filter(
        (participant) => participant.shouldCreateContact,
      );

      await this.messageQueueService.add<CreateCompanyAndContactJobData>(
        CreateCompanyAndContactJob.name,
        {
          workspaceId,
          connectedAccount,
          contactsToCreate,
          source: FieldActorSource.EMAIL,
        },
      );
    }
  }

  private async enqueueEmailAttachmentPersistJobs({
    workspaceId,
    messageIds,
  }: {
    workspaceId: string;
    messageIds: string[];
  }): Promise<void> {
    if (messageIds.length === 0) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageParticipantRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageParticipantWorkspaceEntity>(
            workspaceId,
            'messageParticipant',
          );

        const participants = await messageParticipantRepository.find({
          where: {
            messageId: In(messageIds),
          },
        });

        const participantsByMessageId = participants.reduce<
          Map<string, MessageParticipantWorkspaceEntity[]>
        >((accumulator, participant) => {
          if (!isDefined(participant.messageId)) {
            return accumulator;
          }

          const existingParticipants =
            accumulator.get(participant.messageId) ?? [];

          existingParticipants.push(participant);
          accumulator.set(participant.messageId, existingParticipants);

          return accumulator;
        }, new Map());

        for (const messageId of messageIds) {
          const messageParticipants = participantsByMessageId.get(messageId);

          if (
            !isDefined(messageParticipants) ||
            messageParticipants.length === 0
          ) {
            continue;
          }

          const pendingContext =
            await this.messagingEmailAttachmentPendingCacheService.getPendingContext(
              {
                workspaceId,
                messageId,
              },
            );

          if (
            !isDefined(pendingContext) ||
            !this.messagingEmailAttachmentService.hasTargetPersonsForPendingContext(
              {
                participants: messageParticipants,
                pendingContext,
              },
            )
          ) {
            continue;
          }

          await this.messagingQueueService.add(
            MessagingPersistEmailAttachmentsJob.name,
            {
              workspaceId,
              messageId,
              participants: messageParticipants,
            },
          );
        }
      },
      authContext,
      { lite: true },
    );
  }
}
