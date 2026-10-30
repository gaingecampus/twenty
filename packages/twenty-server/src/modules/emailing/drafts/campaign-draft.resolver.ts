import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';
import { PermissionFlagType } from 'twenty-shared/constants';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import {
  SavedMessageCampaignDraft,
  SaveMessageCampaignDraftInput,
} from './campaign-draft.dto';
import { CampaignDraftService } from './campaign-draft.service';

@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE),
)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class CampaignDraftResolver {
  constructor(private readonly drafts: CampaignDraftService) {}

  @Mutation(() => SavedMessageCampaignDraft)
  saveMessageCampaignDraft(
    @Args('input') input: SaveMessageCampaignDraftInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.drafts.save(workspace.id, input);
  }
}
