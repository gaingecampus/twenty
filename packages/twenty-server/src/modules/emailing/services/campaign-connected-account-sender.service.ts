import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedAccountProvider,
  MessageChannelType,
} from 'twenty-shared/types';
import { Repository } from 'typeorm';

import { ConnectedAccountMetadataService } from 'src/engine/metadata-modules/connected-account/connected-account-metadata.service';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { MessagingMessageOutboundService } from 'src/modules/messaging/message-outbound-manager/services/messaging-message-outbound.service';
import { MessageSuppressionService } from 'src/modules/emailing/services/message-suppression.service';
import { UnsubscribeTokenService } from 'src/engine/core-modules/emailing-domain/services/unsubscribe-token.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { buildUnsubscribeHtmlFooter } from 'src/engine/core-modules/emailing-domain/utils/build-unsubscribe-html-footer.util';
import { buildUnsubscribeTextFooter } from 'src/engine/core-modules/emailing-domain/utils/build-unsubscribe-text-footer.util';
import {
  EmailingDomainDriverException,
  EmailingDomainDriverExceptionCode,
} from 'src/engine/core-modules/emailing-domain/drivers/exceptions/emailing-domain-driver.exception';
import { type EmailingDomainEmailContent } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain-email-content.type';
import { type SendMessageResult } from 'src/modules/messaging/message-outbound-manager/types/send-message-result.type';

const PROVIDERS = [
  ConnectedAccountProvider.GOOGLE,
  ConnectedAccountProvider.MICROSOFT,
  ConnectedAccountProvider.IMAP_SMTP_CALDAV,
];

@Injectable()
export class CampaignConnectedAccountSenderService {
  constructor(
    @InjectRepository(MessageChannelEntity)
    private readonly channels: Repository<MessageChannelEntity>,
    private readonly accounts: ConnectedAccountMetadataService,
    private readonly outbound: MessagingMessageOutboundService,
    private readonly suppressions: MessageSuppressionService,
    private readonly tokens: UnsubscribeTokenService,
    private readonly config: TwentyConfigService,
  ) {}

  async resolveChannel(
    workspaceId: string,
    userWorkspaceId: string,
    fromAddress: string,
  ): Promise<MessageChannelEntity | null> {
    const channels = await this.channels.find({
      where: {
        workspaceId,
        type: MessageChannelType.EMAIL,
        connectedAccount: { handle: fromAddress },
      },
      relations: { connectedAccount: true },
      order: { id: 'ASC' },
    });
    const eligible = channels.filter((channel) =>
      PROVIDERS.includes(channel.connectedAccount.provider),
    );
    const channel =
      eligible.find(
        (channel) =>
          channel.connectedAccount.userWorkspaceId === userWorkspaceId,
      ) ??
      eligible.find(
        (channel) => channel.connectedAccount.visibility === 'workspace',
      );
    if (!channel) {
      if (eligible.length)
        throw new ForbiddenException('이 발신 계정을 사용할 권한이 없습니다.');
      return null;
    }
    await this.accounts.verifyOwnership({
      id: channel.connectedAccountId,
      workspaceId,
      userWorkspaceId,
    });
    return channel;
  }

  async send(
    workspaceId: string,
    userWorkspaceId: string,
    connectedAccountId: string,
    content: EmailingDomainEmailContent,
  ): Promise<SendMessageResult> {
    const account = await this.accounts.verifyOwnership({
      id: connectedAccountId,
      workspaceId,
      userWorkspaceId,
    });
    if (
      !PROVIDERS.includes(account.provider) ||
      account.handle !== content.from
    ) {
      throw new BadRequestException(
        '발신 계정이 변경되었거나 사용할 수 없습니다.',
      );
    }
    // Campaign sends are one recipient per job, preserving individual opt-outs.
    if (content.to.length !== 1)
      throw new BadRequestException('캠페인 수신자는 한 명이어야 합니다.');
    const email = content.to[0];
    const global = await this.suppressions.getSuppressedAddresses(workspaceId, [
      email,
    ]);
    const topic = content.unsubscribeTopicId
      ? await this.suppressions.getTopicSuppressedAddresses(
          workspaceId,
          [email],
          content.unsubscribeTopicId,
        )
      : new Set<string>();
    if (global.has(email.toLowerCase()) || topic.has(email.toLowerCase())) {
      throw new EmailingDomainDriverException(
        'Recipient opted out',
        EmailingDomainDriverExceptionCode.ALL_RECIPIENTS_SUPPRESSED,
      );
    }
    const token = this.tokens.sign({
      workspaceId,
      emailAddress: email,
      ...(content.unsubscribeTopicId
        ? { unsubscribeTopicId: content.unsubscribeTopicId }
        : {}),
    });
    const url = new URL('/emailing/unsubscribe', this.config.get('SERVER_URL'));
    url.searchParams.set('t', token);
    return this.outbound.sendMessage(
      {
        to: [email],
        subject: content.subject,
        body: `${content.text}${buildUnsubscribeTextFooter(url.toString())}`,
        html: `${content.html ?? ''}${buildUnsubscribeHtmlFooter(url.toString())}`,
      },
      account,
    );
  }
}
