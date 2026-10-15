import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageChannelType } from 'twenty-shared/types';
import { In, Repository } from 'typeorm';

import { ConnectedAccountMetadataService } from 'src/engine/metadata-modules/connected-account/connected-account-metadata.service';
import { MailboxPageDTO } from 'src/engine/metadata-modules/message-channel/dtos/mailbox-page.dto';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';

const PAGE_SIZE = 30;

@Injectable()
export class MailboxService {
  constructor(
    @InjectRepository(MessageChannelEntity)
    private readonly channels: Repository<MessageChannelEntity>,
    @InjectRepository(MessageFolderEntity)
    private readonly folders: Repository<MessageFolderEntity>,
    private readonly accounts: ConnectedAccountMetadataService,
    private readonly orm: GlobalWorkspaceOrmManager,
  ) {}

  async findChannels(workspaceId: string, userWorkspaceId: string) {
    const accountIds = await this.accounts.getUserConnectedAccountIds({
      userWorkspaceId,
      workspaceId,
    });
    if (!accountIds.length) return [];
    return this.channels.find({
      where: {
        workspaceId,
        connectedAccountId: In(accountIds),
        type: MessageChannelType.EMAIL,
      },
    });
  }

  async findMessages({
    workspaceId,
    userWorkspaceId,
    channelId,
    folderId,
    page,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
    channelId: string;
    folderId?: string;
    page: number;
  }): Promise<MailboxPageDTO> {
    if (!Number.isInteger(page) || page < 0 || page > 10000) {
      throw new BadRequestException('Invalid mailbox page');
    }
    const channel = await this.channels.findOne({
      where: { id: channelId, workspaceId },
    });
    const accountIds = await this.accounts.getUserConnectedAccountIds({
      userWorkspaceId,
      workspaceId,
    });

    // Shared workspace channels must never grant access to a personal mailbox.
    if (
      !channel ||
      channel.type !== MessageChannelType.EMAIL ||
      !accountIds.includes(channel.connectedAccountId)
    ) {
      throw new ForbiddenException('Mailbox access denied');
    }
    if (
      folderId &&
      !(await this.folders.findOne({
        where: { id: folderId, messageChannelId: channelId, workspaceId },
      }))
    ) {
      throw new ForbiddenException('Mailbox folder access denied');
    }

    return this.orm.executeInWorkspaceContext(async () => {
      const repository = await this.orm.getRepository<MessageWorkspaceEntity>(
        workspaceId,
        'message',
      );
      const messages = await repository.find({
        where: {
          messageChannelMessageAssociations: {
            messageChannelId: channelId,
            ...(folderId
              ? { messageFolders: { messageFolderId: folderId } }
              : {}),
          },
        },
        relations: ['messageParticipants'],
        order: { receivedAt: 'DESC', id: 'DESC' },
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE + 1,
      });
      return {
        messages: messages.slice(0, PAGE_SIZE).map((message) => ({
          id: message.id,
          subject: message.subject,
          text: message.text,
          receivedAt: message.receivedAt,
          participants: message.messageParticipants ?? [],
        })),
        hasMore: messages.length > PAGE_SIZE,
      };
    }, buildSystemAuthContext(workspaceId));
  }
}
