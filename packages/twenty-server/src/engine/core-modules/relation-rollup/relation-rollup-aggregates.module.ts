import { Module } from '@nestjs/common';

import { RelationRollupAggregatesResolver } from 'src/engine/core-modules/relation-rollup/relation-rollup-aggregates.resolver';
import { RelationRollupAggregatesService } from 'src/engine/core-modules/relation-rollup/relation-rollup-aggregates.service';
import { UserModule } from 'src/engine/core-modules/user/user.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [UserModule, WorkspaceCacheModule],
  providers: [RelationRollupAggregatesResolver, RelationRollupAggregatesService],
  exports: [RelationRollupAggregatesService],
})
export class RelationRollupAggregatesModule {}
