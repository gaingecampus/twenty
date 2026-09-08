import { Module } from '@nestjs/common';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { InstallOpportunityStageTimingCommand } from 'src/database/commands/upgrade-version-command/2-20/2-20-workspace-command-1803000000000-install-opportunity-stage-timing.command';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
@Module({
  imports: [WorkspaceIteratorModule, FieldMetadataModule, WorkspaceCacheModule],
  providers: [InstallOpportunityStageTimingCommand],
})
export class V2_20_UpgradeVersionCommandModule {}
