import { WorkspaceMetadataVersionModule } from 'src/engine/metadata-modules/workspace-metadata-version/workspace-metadata-version.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { Module } from '@nestjs/common';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { RenameCustomerClassificationCommand } from './2-30-workspace-command-1807800000002-rename-customer-classification.command';

@Module({
  imports: [
    WorkspaceIteratorModule,
    WorkspaceCacheModule,
    WorkspaceMetadataVersionModule,
  ],
  providers: [RenameCustomerClassificationCommand],
})
export class V2_30_UpgradeVersionCommandModule {}
