import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  type Type,
} from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { In, type ObjectLiteral } from 'typeorm';
import { v4, v5 } from 'uuid';

import {
  CAMPAIGN_MESSAGE_DELIVERY_STATUS,
  CAMPAIGN_MESSAGE_ID_NAMESPACE,
  CAMPAIGN_STATUS,
  MATERIALIZE_CAMPAIGN_JOB,
  MAX_CAMPAIGN_RECIPIENTS,
  SEND_CAMPAIGN_EMAIL_JOB,
} from 'src/engine/core-modules/emailing-domain/constants/campaign.constant';
import {
  EmailingDomainDriverException,
  EmailingDomainDriverExceptionCode,
} from 'src/engine/core-modules/emailing-domain/drivers/exceptions/emailing-domain-driver.exception';
import { EmailingDomainStatus } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain-status.type';
import { type EmailingDomainSendEmailResult } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain-send-email-result.type';
import { EmailingDomainEntity } from 'src/engine/core-modules/emailing-domain/emailing-domain.entity';
import { type CampaignRecipient } from 'src/engine/core-modules/emailing-domain/types/campaign-recipient.type';
import { type CampaignSkippedBreakdown } from 'src/engine/core-modules/emailing-domain/types/campaign-skipped-breakdown.type';
import { type MaterializeCampaignJobData } from 'src/engine/core-modules/emailing-domain/types/materialize-campaign-job-data.type';
import { type RawCampaignRecipient } from 'src/engine/core-modules/emailing-domain/types/raw-campaign-recipient.type';
import { type SendCampaignEmailJobData } from 'src/engine/core-modules/emailing-domain/types/send-campaign-email-job-data.type';
import { normalizeCampaignRecipients } from 'src/engine/core-modules/emailing-domain/utils/normalize-campaign-recipients.util';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { MessageChannelMetadataService } from 'src/engine/metadata-modules/message-channel/message-channel-metadata.service';
import { type WorkspaceEntityManager } from 'src/engine/twenty-orm/entity-manager/workspace-entity-manager';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { EmailingDomainSenderService } from 'src/modules/emailing/services/emailing-domain-sender.service';
import { MessageSuppressionService } from 'src/modules/emailing/services/message-suppression.service';
import { MessageCampaignWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-campaign.workspace-entity';
import { MessageListMemberWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-list-member.workspace-entity';
import { renderCampaignTemplate } from 'src/modules/emailing/utils/render-campaign-template.util';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { MessageThreadWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-thread.workspace-entity';
import { MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';
import { createHtmlToTextConverter } from 'src/modules/messaging/message-import-manager/utils/create-html-to-text-converter.util';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { MessageParticipantRole } from 'twenty-shared/types';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

type SendCampaignArgs = {
  scheduledAt?: string;
  campaignId?: string;
  scheduleVersion?: string;
  workspaceId: string;
  userWorkspaceId: string;
  listId: string;
  subject: string;
  html: string;
  fromAddress: string;
  unsubscribeTopicId?: string;
};

type SendCampaignResult = {
  campaignId: string;
  queuedCount: number;
  skipped: CampaignSkippedBreakdown;
};

type CampaignAudiencePreview = {
  totalMembers: number;
  withoutEmail: number;
  duplicateEmails: number;
  globallyUnsubscribed: number;
  topicUnsubscribed: number;
  sendable: number;
};

type CampaignMessageRecipient = CampaignRecipient & { messageId: string };

const toRawRecipient = (person: {
  id: string;
  emails?: { primaryEmail?: string | null } | null;
}): RawCampaignRecipient => ({
  personId: person.id,
  email: person.emails?.primaryEmail ?? null,
});

@Injectable()
export class MessageCampaignService {
  private readonly logger = new Logger(MessageCampaignService.name);
  private readonly htmlToText = createHtmlToTextConverter();

  constructor(
    @InjectWorkspaceScopedRepository(EmailingDomainEntity)
    private readonly emailingDomainRepository: WorkspaceScopedRepository<EmailingDomainEntity>,
    private readonly emailingDomainSenderService: EmailingDomainSenderService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectMessageQueue(MessageQueue.emailQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly messageChannelMetadataService: MessageChannelMetadataService,
    private readonly messageSuppressionService: MessageSuppressionService,
  ) {}

  private getUserRepository<T extends ObjectLiteral>(
    workspaceId: string,
    entity: Type<T>,
  ) {
    return this.globalWorkspaceOrmManager.getRepository(workspaceId, entity);
  }

  private getSystemRepository<T extends ObjectLiteral>(
    workspaceId: string,
    entity: Type<T>,
  ) {
    return this.globalWorkspaceOrmManager.getRepository(workspaceId, entity, {
      shouldBypassPermissionChecks: true,
    });
  }

  async send(args: SendCampaignArgs): Promise<SendCampaignResult> {
    const { workspaceId, userWorkspaceId, fromAddress, listId } = args;
    const scheduledAt = args.scheduledAt ? new Date(args.scheduledAt) : null;

    if (
      scheduledAt &&
      (!/([zZ]|[+-]\d{2}:\d{2})$/.test(args.scheduledAt ?? '') ||
        !Number.isFinite(scheduledAt.getTime()) ||
        scheduledAt.getTime() < Date.now() + 60_000)
    ) {
      throw new BadRequestException(
        '예약 시간은 시간대를 포함하여 현재보다 최소 1분 이후여야 합니다.',
      );
    }
    if (args.campaignId && (!scheduledAt || !args.scheduleVersion)) {
      throw new BadRequestException(
        '예약 변경에는 예약 시간과 버전이 필요합니다.',
      );
    }

    const emailingDomain = await this.emailingDomainRepository.findOne(
      workspaceId,
      {
        where: {
          domain: getDomainFromEmail(fromAddress)?.toLowerCase(),
          status: EmailingDomainStatus.VERIFIED,
        },
      },
    );
    if (!emailingDomain) {
      throw new BadRequestException(
        '발신 주소에 연결된 인증된 이메일 도메인이 없습니다.',
      );
    }
    const messageChannel =
      await this.messageChannelMetadataService.getOrCreateEmailGroupChannel({
        fromAddress,
        userWorkspaceId,
        workspaceId,
      });

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const normalized = normalizeCampaignRecipients(
          await this.resolveRecipientsFromList(workspaceId, listId),
          MAX_CAMPAIGN_RECIPIENTS,
        );
        if (normalized.recipients.length === 0) {
          throw new BadRequestException('발송 가능한 수신자가 없습니다.');
        }
        const repository = await this.getUserRepository(
          workspaceId,
          MessageCampaignWorkspaceEntity,
        );
        const dataSource =
          await this.globalWorkspaceOrmManager.getGlobalWorkspaceDataSource();
        if (!dataSource) throw new Error('Workspace datasource unavailable');
        const campaignId = args.campaignId ?? v4();
        const scheduleVersion = scheduledAt ? v4() : null;

        await dataSource.transaction(
          async (manager: WorkspaceEntityManager) => {
            const content = {
              subject: args.subject,
              bodyTemplate: args.html,
              fromAddress: {
                primaryEmail: fromAddress,
                additionalEmails: null,
              },
              unsubscribeTopicId: args.unsubscribeTopicId ?? null,
              listId,
              scheduledAt,
              scheduleVersion,
              status: scheduledAt
                ? CAMPAIGN_STATUS.SCHEDULED
                : CAMPAIGN_STATUS.SENDING,
            };
            if (args.campaignId) {
              const result = await repository.update(
                {
                  id: campaignId,
                  status: CAMPAIGN_STATUS.SCHEDULED,
                  scheduleVersion: args.scheduleVersion,
                },
                content,
                undefined,
                manager,
              );
              if (result.affected !== 1) {
                throw new ConflictException(
                  '이미 변경되거나 발송이 시작된 예약입니다. 목록을 새로 고침하세요.',
                );
              }
            } else {
              await repository.insert({ id: campaignId, ...content }, manager);
            }

            // Enqueue before committing so a queue failure rolls back the reservation.
            // Each revision is checked by the worker, making cancelled/replaced jobs harmless.
            await this.messageQueueService.add<MaterializeCampaignJobData>(
              MATERIALIZE_CAMPAIGN_JOB,
              {
                workspaceId,
                campaignId,
                messageChannelId: messageChannel.id,
                emailingDomainId: emailingDomain.id,
                recipients: normalized.recipients,
                scheduleVersion: scheduleVersion ?? undefined,
              },
              {
                retryLimit: 3,
                delay: scheduledAt
                  ? Math.max(0, scheduledAt.getTime() - Date.now())
                  : 0,
              },
            );
          },
        );
        return {
          campaignId,
          queuedCount: normalized.recipients.length,
          skipped: normalized.skipped,
        };
      },
    );
  }

  async cancelSchedule(
    workspaceId: string,
    campaignId: string,
    scheduleVersion: string,
  ): Promise<boolean> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository = await this.getUserRepository(
          workspaceId,
          MessageCampaignWorkspaceEntity,
        );
        const result = await repository.update(
          {
            id: campaignId,
            scheduleVersion,
            status: CAMPAIGN_STATUS.SCHEDULED,
          },
          { status: CAMPAIGN_STATUS.CANCELLED, scheduleVersion: null },
        );
        if (result.affected !== 1) {
          throw new ConflictException(
            '이미 변경되거나 발송이 시작된 예약입니다. 목록을 새로 고침하세요.',
          );
        }
        return true;
      },
    );
  }

  async processMaterializeJob(data: MaterializeCampaignJobData): Promise<void> {
    const {
      workspaceId,
      campaignId,
      messageChannelId,
      emailingDomainId,
      recipients,
    } = data;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const campaignRepository = await this.getSystemRepository(
        workspaceId,
        MessageCampaignWorkspaceEntity,
      );

      const campaign = await campaignRepository.findOne({
        where: { id: campaignId },
      });

      if (campaign === null) {
        // The producer may still be committing the campaign transaction.
        throw new Error('Campaign is not committed yet');
      }
      if (data.scheduleVersion) {
        if (
          campaign.scheduleVersion !== data.scheduleVersion ||
          (campaign.status !== CAMPAIGN_STATUS.SCHEDULED &&
            campaign.status !== CAMPAIGN_STATUS.SENDING)
        )
          return;
        if (
          campaign.scheduledAt &&
          new Date(campaign.scheduledAt).getTime() > Date.now()
        ) {
          throw new Error('Campaign is not due yet');
        }
        if (campaign.status === CAMPAIGN_STATUS.SCHEDULED) {
          const claimed = await campaignRepository.update(
            {
              id: campaignId,
              status: CAMPAIGN_STATUS.SCHEDULED,
              scheduleVersion: data.scheduleVersion,
            },
            { status: CAMPAIGN_STATUS.SENDING },
          );
          if (claimed.affected !== 1) return;
        }
      } else if (campaign.status !== CAMPAIGN_STATUS.SENDING) {
        return;
      }

      const recipientsByMessageId = new Map<string, CampaignMessageRecipient>();

      for (const recipient of recipients) {
        const messageId = this.campaignMessageId(
          campaignId,
          recipient.personId,
        );

        if (!recipientsByMessageId.has(messageId)) {
          recipientsByMessageId.set(messageId, { ...recipient, messageId });
        }
      }

      const allRecipients = [...recipientsByMessageId.values()];

      const messageRepository = await this.getSystemRepository(
        workspaceId,
        MessageWorkspaceEntity,
      );

      const existingMessages = await messageRepository.find({
        where: { messageCampaignId: campaignId },
        select: { id: true },
      });
      const existingMessageIds = new Set(
        existingMessages.map((message) => message.id),
      );

      const recipientsToCreate = allRecipients.filter(
        (recipient) => !existingMessageIds.has(recipient.messageId),
      );

      if (recipientsToCreate.length > 0) {
        await this.materializeCampaignMessages({
          workspaceId,
          campaignId,
          messageChannelId,
          fromAddress: campaign.fromAddress?.primaryEmail ?? '',
          subjectTemplate: campaign.subject ?? '',
          bodyTemplate: campaign.bodyTemplate ?? '',
          recipients: recipientsToCreate,
        });
      }

      for (const recipient of allRecipients) {
        await this.messageQueueService.add<SendCampaignEmailJobData>(
          SEND_CAMPAIGN_EMAIL_JOB,
          {
            workspaceId,
            campaignId,
            messageId: recipient.messageId,
            personId: recipient.personId,
            recipientEmail: recipient.email,
            emailingDomainId,
          },
          { retryLimit: 3 },
        );
      }

      await this.finalizeCampaignIfComplete(workspaceId, campaignId);
    }, buildSystemAuthContext(workspaceId));
  }

  async processSendJob(data: SendCampaignEmailJobData): Promise<void> {
    const {
      workspaceId,
      campaignId,
      messageId,
      personId,
      recipientEmail,
      emailingDomainId,
    } = data;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const messageRepository = await this.getSystemRepository(
        workspaceId,
        MessageWorkspaceEntity,
      );

      const message = await messageRepository.findOne({
        where: { id: messageId },
      });

      if (
        message === null ||
        message.deliveryStatus !== CAMPAIGN_MESSAGE_DELIVERY_STATUS.QUEUED
      ) {
        return;
      }

      const campaignRepository = await this.getSystemRepository(
        workspaceId,
        MessageCampaignWorkspaceEntity,
      );

      const campaign = await campaignRepository.findOne({
        where: { id: campaignId },
      });

      if (campaign === null) {
        return;
      }

      const personRepository = await this.getSystemRepository(
        workspaceId,
        PersonWorkspaceEntity,
      );

      const person = await personRepository.findOne({
        where: { id: personId },
      });

      const variables = this.buildTemplateVariables(person);
      const subject = renderCampaignTemplate(
        campaign.subject ?? '',
        variables,
        {
          escapeValues: false,
        },
      );
      const html = renderCampaignTemplate(
        campaign.bodyTemplate ?? '',
        variables,
        {
          escapeValues: true,
        },
      );
      const text = this.htmlToText(html);
      const fromAddress = campaign.fromAddress?.primaryEmail ?? '';
      const unsubscribeTopicId = campaign.unsubscribeTopicId ?? undefined;

      // Claim before contacting the provider: concurrent jobs and retries must not resend.
      const claimed = await messageRepository.update(
        {
          id: messageId,
          deliveryStatus: CAMPAIGN_MESSAGE_DELIVERY_STATUS.QUEUED,
        },
        { deliveryStatus: CAMPAIGN_MESSAGE_DELIVERY_STATUS.SENDING },
      );
      if (claimed.affected !== 1) return;

      try {
        let result: EmailingDomainSendEmailResult;

        try {
          result = await this.emailingDomainSenderService.sendEmail(
            workspaceId,
            emailingDomainId,
            {
              from: fromAddress,
              to: [recipientEmail],
              subject,
              text,
              html,
              unsubscribeTopicId,
            },
          );
        } catch (error) {
          const code =
            error instanceof EmailingDomainDriverException ? error.code : null;

          if (
            code === EmailingDomainDriverExceptionCode.ALL_RECIPIENTS_SUPPRESSED
          ) {
            await messageRepository.update(messageId, {
              deliveryStatus: CAMPAIGN_MESSAGE_DELIVERY_STATUS.SKIPPED,
            });

            return;
          }

          await messageRepository.update(messageId, {
            deliveryStatus: CAMPAIGN_MESSAGE_DELIVERY_STATUS.FAILED,
          });
          this.logger.warn(
            `Campaign ${campaignId} send failed for ${recipientEmail}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );

          // A timeout can mean the provider accepted the email. Do not automatically resend.
          return;
        }

        await messageRepository.update(messageId, {
          deliveryStatus: CAMPAIGN_MESSAGE_DELIVERY_STATUS.SENT,
          headerMessageId: result.messageId,
          subject,
          text,
        });

        const associationRepository = await this.getSystemRepository(
          workspaceId,
          MessageChannelMessageAssociationWorkspaceEntity,
        );

        await associationRepository.update(
          { messageId },
          {
            messageExternalId: result.messageId,
            messageThreadExternalId: result.messageId,
          },
        );
      } finally {
        await this.finalizeCampaignIfComplete(workspaceId, campaignId);
      }
    }, buildSystemAuthContext(workspaceId));
  }

  async recordDeliveryFailureByProviderMessageId({
    workspaceId,
    providerMessageId,
    deliveryStatus,
  }: {
    workspaceId: string;
    providerMessageId: string;
    deliveryStatus: string;
  }): Promise<void> {
    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const messageRepository = await this.getSystemRepository(
        workspaceId,
        MessageWorkspaceEntity,
      );

      const message = await messageRepository.findOne({
        where: { headerMessageId: providerMessageId },
      });

      if (message === null || message.messageCampaignId === null) {
        return;
      }

      if (
        message.deliveryStatus === CAMPAIGN_MESSAGE_DELIVERY_STATUS.BOUNCED ||
        message.deliveryStatus === CAMPAIGN_MESSAGE_DELIVERY_STATUS.COMPLAINED
      ) {
        return;
      }

      await messageRepository.update(message.id, { deliveryStatus });
    }, buildSystemAuthContext(workspaceId));
  }

  private async materializeCampaignMessages({
    workspaceId,
    campaignId,
    messageChannelId,
    fromAddress,
    subjectTemplate,
    bodyTemplate,
    recipients,
  }: {
    workspaceId: string;
    campaignId: string;
    messageChannelId: string;
    fromAddress: string;
    subjectTemplate: string;
    bodyTemplate: string;
    recipients: CampaignMessageRecipient[];
  }): Promise<void> {
    const now = new Date();
    const text = this.htmlToText(bodyTemplate);
    const rows = recipients.map((recipient) => ({
      recipient,
      messageId: recipient.messageId,
      threadId: v4(),
      temporaryExternalId: v4(),
    }));

    const messageThreadRepository = await this.getSystemRepository(
      workspaceId,
      MessageThreadWorkspaceEntity,
    );
    const messageRepository = await this.getSystemRepository(
      workspaceId,
      MessageWorkspaceEntity,
    );
    const associationRepository = await this.getSystemRepository(
      workspaceId,
      MessageChannelMessageAssociationWorkspaceEntity,
    );
    const participantRepository = await this.getSystemRepository(
      workspaceId,
      MessageParticipantWorkspaceEntity,
    );

    const workspaceDataSource =
      await this.globalWorkspaceOrmManager.getGlobalWorkspaceDataSource();

    if (!workspaceDataSource) {
      throw new Error(
        `No workspace datasource available for workspace ${workspaceId}`,
      );
    }

    await workspaceDataSource.transaction(
      async (transactionManager: WorkspaceEntityManager) => {
        await messageThreadRepository.insert(
          rows.map((row) => ({ id: row.threadId })),
          transactionManager,
        );
        await messageRepository.insert(
          rows.map((row) => ({
            id: row.messageId,
            headerMessageId: row.temporaryExternalId,
            subject: subjectTemplate,
            text,
            receivedAt: now,
            messageThreadId: row.threadId,
            messageCampaignId: campaignId,
            deliveryStatus: CAMPAIGN_MESSAGE_DELIVERY_STATUS.QUEUED,
          })),
          transactionManager,
        );
        await associationRepository.insert(
          rows.map((row) => ({
            id: v4(),
            messageId: row.messageId,
            messageChannelId,
            messageExternalId: row.temporaryExternalId,
            messageThreadExternalId: row.temporaryExternalId,
            direction: MessageDirection.OUTGOING,
          })),
          transactionManager,
        );
        await participantRepository.insert(
          rows.flatMap((row) => [
            {
              id: v4(),
              messageId: row.messageId,
              role: MessageParticipantRole.FROM,
              handle: fromAddress,
              displayName: fromAddress,
            },
            {
              id: v4(),
              messageId: row.messageId,
              role: MessageParticipantRole.TO,
              handle: row.recipient.email,
              displayName: row.recipient.email,
              personId: row.recipient.personId,
              messageCampaignId: campaignId,
            },
          ]),
          transactionManager,
        );
      },
    );
  }

  private async finalizeCampaignIfComplete(
    workspaceId: string,
    campaignId: string,
  ): Promise<void> {
    const messageRepository = await this.getSystemRepository(
      workspaceId,
      MessageWorkspaceEntity,
    );

    const queuedCount = await messageRepository.count({
      where: {
        messageCampaignId: campaignId,
        deliveryStatus: In([
          CAMPAIGN_MESSAGE_DELIVERY_STATUS.QUEUED,
          CAMPAIGN_MESSAGE_DELIVERY_STATUS.SENDING,
        ]),
      },
    });

    if (queuedCount > 0) {
      return;
    }

    const failedCount = await messageRepository.count({
      where: {
        messageCampaignId: campaignId,
        deliveryStatus: CAMPAIGN_MESSAGE_DELIVERY_STATUS.FAILED,
      },
    });

    const campaignRepository = await this.getSystemRepository(
      workspaceId,
      MessageCampaignWorkspaceEntity,
    );

    await campaignRepository.update(
      { id: campaignId, status: CAMPAIGN_STATUS.SENDING },
      {
        status:
          failedCount > 0
            ? CAMPAIGN_STATUS.SENT_WITH_ERRORS
            : CAMPAIGN_STATUS.SENT,
        sentAt: new Date(),
      },
    );
  }

  async previewAudience({
    workspaceId,
    listId,
    unsubscribeTopicId,
  }: {
    workspaceId: string;
    listId: string;
    unsubscribeTopicId?: string;
  }): Promise<CampaignAudiencePreview> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const rawRecipients = await this.resolveRecipientsFromList(
          workspaceId,
          listId,
        );
        const totalMembers = rawRecipients.length;

        const { recipients, skipped } = normalizeCampaignRecipients(
          rawRecipients,
          MAX_CAMPAIGN_RECIPIENTS,
        );

        const emails = recipients.map((recipient) => recipient.email);

        const globallySuppressed =
          await this.messageSuppressionService.getSuppressedAddresses(
            workspaceId,
            emails,
          );
        const topicSuppressed = isNonEmptyString(unsubscribeTopicId)
          ? await this.messageSuppressionService.getTopicSuppressedAddresses(
              workspaceId,
              emails,
              unsubscribeTopicId,
            )
          : new Set<string>();

        let globallyUnsubscribed = 0;
        let topicUnsubscribed = 0;
        let sendable = 0;

        for (const recipient of recipients) {
          const normalizedEmail = recipient.email.trim().toLowerCase();

          if (globallySuppressed.has(normalizedEmail)) {
            globallyUnsubscribed += 1;
          } else if (topicSuppressed.has(normalizedEmail)) {
            topicUnsubscribed += 1;
          } else {
            sendable += 1;
          }
        }

        return {
          totalMembers,
          withoutEmail: skipped.noEmail,
          duplicateEmails: skipped.deduped,
          globallyUnsubscribed,
          topicUnsubscribed,
          sendable,
        };
      },
    );
  }

  private async resolveRecipientsFromList(
    workspaceId: string,
    listId: string,
  ): Promise<RawCampaignRecipient[]> {
    const listMemberRepository = await this.getUserRepository(
      workspaceId,
      MessageListMemberWorkspaceEntity,
    );

    const members = await listMemberRepository.find({
      where: { listId },
    });

    return this.loadRecipientsByPersonIds(
      workspaceId,
      members.map((member) => member.personId),
    );
  }

  private async loadRecipientsByPersonIds(
    workspaceId: string,
    personIds: string[],
  ): Promise<RawCampaignRecipient[]> {
    if (personIds.length === 0) {
      return [];
    }

    const personRepository = await this.getUserRepository(
      workspaceId,
      PersonWorkspaceEntity,
    );

    const people = await personRepository.find({
      where: { id: In(personIds) },
    });

    return people.map(toRawRecipient);
  }

  private buildTemplateVariables(
    person: PersonWorkspaceEntity | null,
  ): Record<string, string> {
    const firstName = person?.name?.firstName ?? '';
    const lastName = person?.name?.lastName ?? '';

    return {
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(' '),
      email: person?.emails?.primaryEmail ?? '',
    };
  }

  private campaignMessageId(campaignId: string, personId: string): string {
    return v5(`${campaignId}:${personId}`, CAMPAIGN_MESSAGE_ID_NAMESPACE);
  }
}
