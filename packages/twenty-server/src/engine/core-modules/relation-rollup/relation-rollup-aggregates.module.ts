import { Module } from '@nestjs/common';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsDispatchEntity } from 'src/engine/core-modules/sms/sms-dispatch.entity';
import { CouponDispatchEntity } from 'src/engine/core-modules/coupon/coupon-dispatch.entity';
import { CampaignRecipientCountService } from './campaign-recipient-count.service';

import { RelationRollupAggregatesResolver } from 'src/engine/core-modules/relation-rollup/relation-rollup-aggregates.resolver';
import { RelationRollupAggregatesService } from 'src/engine/core-modules/relation-rollup/relation-rollup-aggregates.service';
import { UserModule } from 'src/engine/core-modules/user/user.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [
    UserModule,
    WorkspaceCacheModule,
    TypeOrmModule.forFeature([SmsDispatchEntity, CouponDispatchEntity]),
  ],
  providers: [
    RelationRollupAggregatesResolver,
    RelationRollupAggregatesService,
    CampaignRecipientCountService,
    provideWorkspaceScopedRepository(SmsDispatchEntity),
    provideWorkspaceScopedRepository(CouponDispatchEntity),
  ],
  exports: [RelationRollupAggregatesService],
})
export class RelationRollupAggregatesModule {}
