import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import {
  SmsCampaignDeliveriesInput,
  SmsCampaignDeliveryPage,
} from './sms-campaign-deliveries.dto';
import { SmsService } from './sms.service';

// Reading history requires access to the campaign, not permission to send SMS.
@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class SmsCampaignDeliveriesResolver {
  constructor(private readonly sms: SmsService) {}

  @Query(() => SmsCampaignDeliveryPage)
  smsCampaignDeliveries(
    @Args('input') input: SmsCampaignDeliveriesInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.sms.campaignDeliveries(workspace.id, input);
  }
}
