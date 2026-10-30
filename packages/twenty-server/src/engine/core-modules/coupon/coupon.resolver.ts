import { Type } from 'class-transformer';
import { CampaignDraftReferenceInput } from 'src/modules/emailing/drafts/campaign-draft-reference.input';
import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Field, InputType, Int, Mutation, Query } from '@nestjs/graphql';
import {
  IsOptional,
  ValidateNested,
  IsInt,
  IsUUID,
  Min,
} from 'class-validator';
import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import {
  CouponCapabilities,
  CouponDispatchSummary,
  CouponPreviewInput,
} from './coupon.dto';
import { CouponService } from './coupon.service';

@InputType()
class CouponSimulationInput {
  @Field(() => CampaignDraftReferenceInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignDraftReferenceInput)
  draft?: CampaignDraftReferenceInput;
  @Field(() => String) @IsUUID('4') quoteId: string;
}

@InputType()
class CouponSendInput extends CouponSimulationInput {
  @Field(() => String) @IsUUID('4') quoteId: string;
  @Field(() => Int) @IsInt() @Min(0) confirmedCost: number;
}

@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE),
)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class CouponResolver {
  constructor(private readonly coupons: CouponService) {}

  @Query(() => CouponCapabilities)
  couponCapabilities(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.coupons.capabilities(workspace.id);
  }

  @Mutation(() => CouponDispatchSummary)
  previewCouponDispatch(
    @Args('input') input: CouponPreviewInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actor: string,
  ) {
    return this.coupons.preview(workspace.id, actor, input);
  }

  @Mutation(() => CouponDispatchSummary)
  simulateCouponDispatch(
    @Args('input') input: CouponSimulationInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actor: string,
  ) {
    return this.coupons.simulate(
      workspace.id,
      actor,
      input.quoteId,
      input.draft,
    );
  }

  @Mutation(() => CouponDispatchSummary)
  sendCouponDispatch(
    @Args('input') input: CouponSendInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actor: string,
  ) {
    return this.coupons.send(
      workspace.id,
      actor,
      input.quoteId,
      input.confirmedCost,
      input.draft,
    );
  }

  @Mutation(() => CouponDispatchSummary)
  refreshCouponDispatch(
    @Args('input') input: CouponSimulationInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actor: string,
  ) {
    return this.coupons.refresh(workspace.id, actor, input.quoteId);
  }

  @Query(() => [CouponDispatchSummary])
  couponDispatchHistory(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actor: string,
  ) {
    return this.coupons.history(workspace.id, actor);
  }
}
