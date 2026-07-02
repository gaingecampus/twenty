import { Command } from 'nest-commander';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ADDITIVE_INFER_DELETION_FROM_MISSING_ENTITIES } from 'src/engine/workspace-manager/twenty-standard-application/constants/additive-infer-deletion-from-missing-entities.constant';
import { TwentyStandardApplicationService } from 'src/engine/workspace-manager/twenty-standard-application/services/twenty-standard-application.service';

@Command({
  name: 'sync-twenty-standard-application',
  description:
    'Reconcile twenty-standard application metadata with current code definitions. Adds or updates missing standard metadata without deleting existing entities.',
})
export class SyncTwentyStandardApplicationCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly twentyStandardApplicationService: TwentyStandardApplicationService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const syncResult =
      await this.twentyStandardApplicationService.synchronizeTwentyStandardApplicationOrThrow(
        {
          workspaceId,
          inferDeletionFromMissingEntities:
            ADDITIVE_INFER_DELETION_FROM_MISSING_ENTITIES,
          dryRun: options.dryRun ?? false,
        },
      );

    if (options.dryRun) {
      const deleteActionKeys = Object.keys(
        syncResult.actionCountsByTypeAndMetadataName,
      ).filter((actionKey) => actionKey.startsWith('delete:'));

      this.logger.log(
        `[DRY RUN] Would apply ${syncResult.totalActions} migration action(s) for workspace ${workspaceId}`,
      );

      if (syncResult.totalActions > 0) {
        this.logger.log(
          `[DRY RUN] Action breakdown: ${JSON.stringify(syncResult.actionCountsByTypeAndMetadataName)}`,
        );
      }

      if (deleteActionKeys.length > 0) {
        this.logger.log(
          `[DRY RUN] Warning: delete actions detected: ${deleteActionKeys.join(', ')}`,
        );
      }

      return;
    }

    this.logger.log(
      `Synced twenty-standard application for workspace ${workspaceId}`,
    );
  }
}
