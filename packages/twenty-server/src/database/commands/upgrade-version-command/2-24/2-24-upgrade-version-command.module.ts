import { EnableFieldSummaryStorageCommand } from './2-24-instance-command-fast-1807200000000-enable-field-summary-storage';
import { StopOpportunityDriAutoAssignCommand } from './2-24-workspace-command-1807100000000-stop-opportunity-dri-auto-assign.command';
import { Module } from '@nestjs/common';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { InstallFieldManagementCommand } from './2-24-workspace-command-1807000000000-install-field-management.command';
@Module({
  imports: [
    WorkspaceIteratorModule,
    WorkspaceCacheModule,
    FieldMetadataModule,
    ObjectMetadataModule,
  ],
  providers: [
    EnableFieldSummaryStorageCommand,
    InstallFieldManagementCommand,
    StopOpportunityDriAutoAssignCommand,
  ],
})
export class V2_24_UpgradeVersionCommandModule {}
