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
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';

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
    private readonly userRoles: UserRoleService,
  ) {}

  private async isWorkspaceAdmin(workspaceId: string, userWorkspaceId: string) {
    const roles = await this.userRoles.getRolesByUserWorkspaces({
      workspaceId,
      userWorkspaceIds: [userWorkspaceId],
    });

    return (roles.get(userWorkspaceId) ?? []).some(
      (role) =>
        role.universalIdentifier === STANDARD_ROLE.admin.universalIdentifier,
    );
  }

  private async verifyChannelAccess(
    workspaceId: string,
    userWorkspaceId: string,
    channelId: string,
  ) {
    const channel = await this.channels.findOne({
      where: { id: channelId, workspaceId },
    });

    if (!channel || channel.type !== MessageChannelType.EMAIL) {
      throw new ForbiddenException('Mailbox access denied');
    }
    if (await this.isWorkspaceAdmin(workspaceId, userWorkspaceId)) return;

    const accountIds = await this.accounts.getUserConnectedAccountIds({
      userWorkspaceId,
      workspaceId,
    });
    if (!accountIds.includes(channel.connectedAccountId)) {
      throw new ForbiddenException('Mailbox access denied');
    }
  }

  async findFolders(
    workspaceId: string,
    userWorkspaceId: string,
    channelId: string,
  ) {
    await this.verifyChannelAccess(workspaceId, userWorkspaceId, channelId);
    return this.folders.find({
      where: { workspaceId, messageChannelId: channelId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findChannels(workspaceId: string, userWorkspaceId: string) {
    if (await this.isWorkspaceAdmin(workspaceId, userWorkspaceId)) {
      return this.channels.find({
        where: { workspaceId, type: MessageChannelType.EMAIL },
        order: { handle: 'ASC', id: 'ASC' },
      });
    }
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
    await this.verifyChannelAccess(workspaceId, userWorkspaceId, channelId);
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
