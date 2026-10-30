import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';
import { PermissionFlagType } from 'twenty-shared/constants';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import {
  SmsDispatchSummary,
  SmsPreview,
  SmsPreviewInput,
  SmsSendInput,
} from './sms.dto';
import { SmsService } from './sms.service';

@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE),
)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class SmsResolver {
  constructor(private readonly sms: SmsService) {}
  @Query(() => Boolean)
  isSmsDispatchAvailable(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.sms.isAvailable(workspace.id);
  }

  @Query(() => SmsPreview)
  previewSmsDispatch(
    @Args('input') input: SmsPreviewInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.sms.preview(workspace.id, input);
  }
  @Mutation(() => SmsDispatchSummary)
  sendSmsDispatch(
    @Args('input') input: SmsSendInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return this.sms.send(workspace.id, userWorkspaceId, input);
  }
  @Query(() => [SmsDispatchSummary])
  smsDispatchHistory(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return this.sms.history(workspace.id, userWorkspaceId);
  }
}
