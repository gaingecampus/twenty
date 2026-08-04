import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { In, IsNull, Repository } from 'typeorm';

import { AppOAuthRevokeService } from 'src/engine/core-modules/application/connection-provider/refresh/services/app-oauth-revoke.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { CALENDAR_CHANNEL_DELETED_EVENT } from 'src/engine/metadata-modules/calendar-channel/constants/calendar-channel-deleted.constant';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { type CalendarChannelDeletedEvent } from 'src/engine/metadata-modules/calendar-channel/types/calendar-channel-deleted.type';
import { CONNECTED_ACCOUNT_DELETED_EVENT } from 'src/engine/metadata-modules/connected-account/constants/connected-account-deleted.constant';
import {
  ConnectedAccountException,
  ConnectedAccountExceptionCode,
} from 'src/engine/metadata-modules/connected-account/connected-account.exception';
import { type WorkspaceConnectedAccountDTO } from 'src/engine/metadata-modules/connected-account/dtos/workspace-connected-account.dto';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { type ConnectedAccountDeletedEvent } from 'src/engine/metadata-modules/connected-account/types/connected-account-deleted.type';
import { MESSAGE_CHANNEL_DELETED_EVENT } from 'src/engine/metadata-modules/message-channel/constants/message-channel-deleted.constant';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { type MessageChannelDeletedEvent } from 'src/engine/metadata-modules/message-channel/types/message-channel-deleted.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceEventEmitter } from 'src/engine/workspace-event-emitter/workspace-event-emitter';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';

@Injectable()
export class ConnectedAccountMetadataService {
  private readonly logger = new Logger(ConnectedAccountMetadataService.name);

  constructor(
    @InjectRepository(ConnectedAccountEntity)
    private readonly repository: Repository<ConnectedAccountEntity>,
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly appOAuthRevokeService: AppOAuthRevokeService,
    private readonly workspaceEventEmitter: WorkspaceEventEmitter,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async findByUserWorkspaceId({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<ConnectedAccountEntity[]> {
    return this.repository.find({
      where: { userWorkspaceId, workspaceId },
    });
  }

  async findById({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }): Promise<ConnectedAccountEntity | null> {
    return this.repository.findOne({ where: { id, workspaceId } });
  }

  async findByIdAndUserWorkspaceId({
    id,
    userWorkspaceId,
    workspaceId,
  }: {
    id: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<ConnectedAccountEntity | null> {
    return this.repository.findOne({
      where: { id, userWorkspaceId, workspaceId },
    });
  }

  async verifyOwnership({
    id,
    userWorkspaceId,
    workspaceId,
  }: {
    id: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<ConnectedAccountEntity> {
    const connectedAccount = await this.repository.findOne({
      where: { id, workspaceId },
    });

    if (!connectedAccount) {
      throw new ConnectedAccountException(
        `Connected account ${id} not found`,
        ConnectedAccountExceptionCode.CONNECTED_ACCOUNT_NOT_FOUND,
      );
    }

    if (
      connectedAccount.visibility !== 'workspace' &&
      connectedAccount.userWorkspaceId !== userWorkspaceId
    ) {
      throw new ConnectedAccountException(
        `Connected account ${id} does not belong to user workspace ${userWorkspaceId}`,
        ConnectedAccountExceptionCode.CONNECTED_ACCOUNT_OWNERSHIP_VIOLATION,
      );
    }

    return connectedAccount;
  }

  async getUserConnectedAccountIds({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<string[]> {
    const accounts = await this.repository.find({
      where: { userWorkspaceId, workspaceId },
      select: ['id'],
    });

    return accounts.map((account) => account.id);
  }

  async getWorkspaceSharedConnectedAccountIds({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<string[]> {
    const accounts = await this.repository.find({
      where: { workspaceId, visibility: 'workspace' },
      select: ['id'],
    });

    return accounts.map((account) => account.id);
  }

  async findWorkspaceConnectedAccounts({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<WorkspaceConnectedAccountDTO[]> {
    const accounts = await this.repository.find({
      where: { workspaceId },
      relations: {
        messageChannels: true,
      },
      order: { createdAt: 'ASC' },
    });

    if (accounts.length === 0) {
      return [];
    }

    const userWorkspaceIds = [
      ...new Set(accounts.map((account) => account.userWorkspaceId)),
    ];

    const userWorkspaces = await this.userWorkspaceRepository.find({
      where: { id: In(userWorkspaceIds), workspaceId },
      relations: { user: true },
    });

    const ownerByUserWorkspaceId = new Map(
      userWorkspaces.map((userWorkspace) => [
        userWorkspace.id,
        {
          user: userWorkspace.user,
          avatarUrl: userWorkspace.defaultAvatarUrl ?? null,
        },
      ]),
    );

    const messageChannelIds = accounts.flatMap((account) =>
      account.messageChannels.map((messageChannel) => messageChannel.id),
    );

    const messageCountByChannelId =
      await this.getMessageCountsByMessageChannelIds({
        workspaceId,
        messageChannelIds,
      });

    return accounts.map((account) => {
      const owner = ownerByUserWorkspaceId.get(account.userWorkspaceId);
      const primaryMessageChannel =
        account.messageChannels.find(
          (messageChannel) => messageChannel.handle === account.handle,
        ) ?? account.messageChannels[0];

      const messageCount = account.messageChannels.reduce(
        (total, messageChannel) =>
          total + (messageCountByChannelId.get(messageChannel.id) ?? 0),
        0,
      );

      return {
        id: account.id,
        handle: account.handle,
        provider: account.provider,
        visibility: account.visibility,
        userWorkspaceId: account.userWorkspaceId,
        ownerEmail: owner?.user?.email ?? null,
        ownerFirstName: owner?.user?.firstName ?? null,
        ownerLastName: owner?.user?.lastName ?? null,
        ownerAvatarUrl: owner?.avatarUrl ?? null,
        syncStatus: isDefined(primaryMessageChannel)
          ? primaryMessageChannel.syncStatus
          : null,
        messageChannelId: primaryMessageChannel?.id ?? null,
        messageCount,
        syncedAt: primaryMessageChannel?.syncedAt ?? null,
        authFailedAt: account.authFailedAt,
        archivedAt: account.archivedAt,
        createdAt: account.createdAt,
      };
    });
  }

  private async getMessageCountsByMessageChannelIds({
    workspaceId,
    messageChannelIds,
  }: {
    workspaceId: string;
    messageChannelIds: string[];
  }): Promise<Map<string, number>> {
    if (messageChannelIds.length === 0) {
      return new Map();
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const associationRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
            workspaceId,
            'messageChannelMessageAssociation',
          );

        const rows: Array<{ messageChannelId: string; count: string }> =
          await associationRepository
            .createQueryBuilder('association')
            .select('association.messageChannelId', 'messageChannelId')
            .addSelect('COUNT(*)', 'count')
            .where('association.messageChannelId IN (:...messageChannelIds)', {
              messageChannelIds,
            })
            .groupBy('association.messageChannelId')
            .getRawMany();

        return new Map(
          rows.map((row) => [row.messageChannelId, Number(row.count)]),
        );
      },
      authContext,
    );
  }

  async create(
    data: Partial<ConnectedAccountEntity> & {
      workspaceId: string;
      handle: string;
      provider: string;
      userWorkspaceId: string;
    },
  ): Promise<ConnectedAccountEntity> {
    const entity = this.repository.create(data);

    return this.repository.save(entity);
  }

  async update({
    id,
    workspaceId,
    data,
  }: {
    id: string;
    workspaceId: string;
    data: Partial<ConnectedAccountEntity>;
  }): Promise<ConnectedAccountEntity> {
    await this.repository.update(
      { id, workspaceId },
      data as Record<string, unknown>,
    );

    return this.repository.findOneOrFail({ where: { id, workspaceId } });
  }

  async transferOwnership({
    fromUserWorkspaceId,
    toUserWorkspaceId,
    workspaceId,
  }: {
    fromUserWorkspaceId: string;
    toUserWorkspaceId: string;
    workspaceId: string;
  }): Promise<void> {
    const connectedAccounts = await this.repository.find({
      where: { userWorkspaceId: fromUserWorkspaceId, workspaceId },
    });

    if (connectedAccounts.length === 0) {
      return;
    }

    const connectedAccountIds = connectedAccounts.map((account) => account.id);

    await this.repository.manager.transaction(async (entityManager) => {
      await entityManager.update(
        ConnectedAccountEntity,
        { id: In(connectedAccountIds), workspaceId },
        {
          userWorkspaceId: toUserWorkspaceId,
          accessToken: null,
          refreshToken: null,
          connectionParameters: null,
        },
      );

      await entityManager.update(
        ConnectedAccountEntity,
        { id: In(connectedAccountIds), workspaceId, archivedAt: IsNull() },
        { archivedAt: new Date() },
      );

      await entityManager.update(
        MessageChannelEntity,
        { connectedAccountId: In(connectedAccountIds), workspaceId },
        { isSyncEnabled: false },
      );

      await entityManager.update(
        CalendarChannelEntity,
        { connectedAccountId: In(connectedAccountIds), workspaceId },
        { isSyncEnabled: false },
      );
    });

    for (const connectedAccount of connectedAccounts) {
      await this.appOAuthRevokeService.revokeIfApp(connectedAccount);
    }
  }

  async delete({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }): Promise<ConnectedAccountEntity> {
    const connectedAccount = await this.repository.findOneOrFail({
      where: { id, workspaceId },
    });

    const [messageChannels, calendarChannels] = await Promise.all([
      this.messageChannelRepository.find({
        where: { connectedAccountId: id, workspaceId },
        select: { id: true },
      }),
      this.calendarChannelRepository.find({
        where: { connectedAccountId: id, workspaceId },
        select: { id: true },
      }),
    ]);

    this.logger.log(
      `WorkspaceId: ${workspaceId} Deleting connected account ${id} with ${messageChannels.length} message channel(s) and ${calendarChannels.length} calendar channel(s)`,
    );

    await this.appOAuthRevokeService.revokeIfApp(connectedAccount);

    await this.repository.delete({ id, workspaceId });

    this.workspaceEventEmitter.emitCustomBatchEvent<MessageChannelDeletedEvent>(
      MESSAGE_CHANNEL_DELETED_EVENT,
      messageChannels.map((messageChannel) => ({
        messageChannelId: messageChannel.id,
      })),
      workspaceId,
    );

    this.workspaceEventEmitter.emitCustomBatchEvent<CalendarChannelDeletedEvent>(
      CALENDAR_CHANNEL_DELETED_EVENT,
      calendarChannels.map((calendarChannel) => ({
        calendarChannelId: calendarChannel.id,
      })),
      workspaceId,
    );

    this.workspaceEventEmitter.emitCustomBatchEvent<ConnectedAccountDeletedEvent>(
      CONNECTED_ACCOUNT_DELETED_EVENT,
      [
        {
          connectedAccountId: id,
          userWorkspaceId: connectedAccount.userWorkspaceId,
        },
      ],
      workspaceId,
    );

    return connectedAccount;
  }
}
