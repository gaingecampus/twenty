import { Module } from '@nestjs/common';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { StopOnboardingConsultantAutoAssignCommand } from 'src/database/commands/upgrade-version-command/2-23/2-23-workspace-command-1806000000000-stop-onboarding-consultant-auto-assign.command';
@Module({
  imports: [WorkspaceIteratorModule, WorkspaceCacheModule],
  providers: [StopOnboardingConsultantAutoAssignCommand],
})
export class V2_23_UpgradeVersionCommandModule {}
