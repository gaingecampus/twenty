import { Module } from '@nestjs/common';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { StopOnboardingCollaboratorAutomationCommand } from 'src/database/commands/upgrade-version-command/2-22/2-22-workspace-command-1805000000000-stop-onboarding-collaborator-automation.command';
@Module({
  imports: [WorkspaceIteratorModule, WorkspaceCacheModule],
  providers: [StopOnboardingCollaboratorAutomationCommand],
})
export class V2_22_UpgradeVersionCommandModule {}
