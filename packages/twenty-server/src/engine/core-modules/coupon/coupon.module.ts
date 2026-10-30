import { CampaignDraftModule } from 'src/modules/emailing/drafts/campaign-draft.module';
import { SecretEncryptionModule } from '../secret-encryption/secret-encryption.module';
import { SendbeeClient } from './sendbee.client';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { CouponDispatchEntity } from './coupon-dispatch.entity';
import { CouponResolver } from './coupon.resolver';
import { CouponService } from './coupon.service';

@Module({
  imports: [
    CampaignDraftModule,
    TypeOrmModule.forFeature([CouponDispatchEntity]),
    PermissionsModule,
    SecretEncryptionModule,
  ],
  providers: [CouponService, CouponResolver, SendbeeClient],
})
export class CouponModule {}
