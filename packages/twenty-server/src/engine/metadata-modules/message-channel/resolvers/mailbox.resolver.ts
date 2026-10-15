import { MessageChannelDTO } from 'src/engine/metadata-modules/message-channel/dtos/message-channel.dto';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { MailboxPageDTO } from 'src/engine/metadata-modules/message-channel/dtos/mailbox-page.dto';
import { MailboxService } from 'src/engine/metadata-modules/message-channel/mailbox.service';

@MetadataResolver(() => MailboxPageDTO)
@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
export class MailboxResolver {
  constructor(private readonly mailbox: MailboxService) {}

  @Query(() => [MessageChannelDTO])
  myPersonalMailboxChannels(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return this.mailbox.findChannels(workspace.id, userWorkspaceId);
  }

  @Query(() => MailboxPageDTO)
  myMailboxMessages(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('folderId', { type: () => UUIDScalarType, nullable: true })
    folderId: string | undefined,
    @Args('page', { type: () => Int, defaultValue: 0 }) page: number,
  ): Promise<MailboxPageDTO> {
    return this.mailbox.findMessages({
      workspaceId: workspace.id,
      userWorkspaceId,
      channelId,
      folderId,
      page,
    });
  }
}
