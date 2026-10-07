import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { Module } from '@nestjs/common';
import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { BillingModule } from 'src/engine/core-modules/billing/billing.module';
import { AiBillingModule } from 'src/engine/metadata-modules/ai/ai-billing/ai-billing.module';
import { AiModelsModule } from 'src/engine/metadata-modules/ai/ai-models/ai-models.module';
import { FieldSummaryController } from './field-summary.controller';
import { FieldSummaryService } from './field-summary.service';

@Module({
  imports: [
    KeyValuePairModule,
    TokenModule,
    PermissionsModule,
    WorkspaceCacheStorageModule,
    BillingModule,
    AiBillingModule,
    AiModelsModule,
  ],
  controllers: [FieldSummaryController],
  providers: [FieldSummaryService],
})
export class FieldSummaryModule {}
