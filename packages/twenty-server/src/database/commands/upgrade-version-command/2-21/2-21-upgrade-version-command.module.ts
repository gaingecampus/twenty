import { Module } from '@nestjs/common';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { InstallGaingeAutomationCommand } from 'src/database/commands/upgrade-version-command/2-21/2-21-workspace-command-1804000000000-install-gainge-automation.command';
@Module({
  imports: [WorkspaceIteratorModule, FieldMetadataModule, WorkspaceCacheModule],
  providers: [InstallGaingeAutomationCommand],
})
export class V2_21_UpgradeVersionCommandModule {}
