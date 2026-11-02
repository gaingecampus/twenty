import { CampaignDraftModule } from 'src/modules/emailing/drafts/campaign-draft.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { SmsDispatchEntity } from './sms-dispatch.entity';
import { GaingeSmsService } from './gainge-sms.service';
import { SmsService } from './sms.service';
import { SmsResolver } from './sms.resolver';
import { SmsCampaignDeliveriesResolver } from './sms-campaign-deliveries.resolver';
@Module({
  imports: [
    CampaignDraftModule,
    TypeOrmModule.forFeature([SmsDispatchEntity]),
    PermissionsModule,
  ],
  providers: [
    GaingeSmsService,
    SmsService,
    SmsResolver,
    SmsCampaignDeliveriesResolver,
  ],
  exports: [SmsService],
})
export class SmsModule {}
