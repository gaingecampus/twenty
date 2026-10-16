import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { GaingeSalesReportDTO } from 'src/modules/gainge-sales/gainge-sales.dto';
import { GaingeSalesService } from 'src/modules/gainge-sales/gainge-sales.service';

@MetadataResolver()
@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
export class GaingeSalesResolver {
  constructor(private readonly salesService: GaingeSalesService) {}

  @Query(() => GaingeSalesReportDTO)
  async gaingeMonthlySales(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() memberId: string | undefined,
    @Args('month', { type: () => String }) month: string,
  ): Promise<GaingeSalesReportDTO> {
    return this.salesService.getMonthlySales(workspace.id, memberId, month);
  }
  @Query(() => GaingeSalesReportDTO)
  async gaingeSalesTimeline(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() memberId: string | undefined,
    @Args('month', { type: () => String }) month: string,
  ): Promise<GaingeSalesReportDTO> {
    return this.salesService.getSalesTimeline(workspace.id, memberId, month);
  }
}
