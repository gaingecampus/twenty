import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import {
  RelationRollupAggregateResultDTO,
  RelationRollupAggregatesArgs,
} from 'src/engine/core-modules/relation-rollup/dtos/relation-rollup-aggregates.dto';
import { RelationRollupAggregatesService } from 'src/engine/core-modules/relation-rollup/relation-rollup-aggregates.service';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => RelationRollupAggregateResultDTO)
export class RelationRollupAggregatesResolver {
  constructor(
    private readonly relationRollupAggregatesService: RelationRollupAggregatesService,
  ) {}

  @Query(() => [RelationRollupAggregateResultDTO])
  async relationRollupAggregates(
    @Args() args: RelationRollupAggregatesArgs,
  ): Promise<RelationRollupAggregateResultDTO[]> {
    const authContext = getWorkspaceAuthContext();

    return this.relationRollupAggregatesService.computeRelationRollupAggregates(
      {
        authContext,
        parentObjectNameSingular: args.parentObjectNameSingular,
        parentRecordIds: args.parentRecordIds,
        rollups: args.rollups,
      },
    );
  }
}
