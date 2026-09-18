import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';
import { Command } from 'nest-commander';
import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { computeTableName } from 'src/engine/utils/compute-table-name.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  AUTOMATED_COLLABORATOR_NAME,
  AUTOMATION_TARGETS,
  buildAutomatedCollaboratorCleanupSql,
  buildAutomationSql,
} from 'src/modules/gainge-automation/automation-schema';

// Reinstalls only the contract triggers installed by 2.21.0 so that editing a
// contract no longer adds the editor as a co-consultant, then soft-deletes the
// co-consultant links that automation created. Links added by people stay, and
// soft-deleted links can be restored from deletedAt.
@RegisteredWorkspaceCommand('2.22.0', 1805000000000)
@Command({
  name: 'upgrade:2-22:stop-onboarding-collaborator-automation',
  description:
    'Stop adding contract editors as co-consultants in the CRM automation.',
})
export class StopOnboardingCollaboratorAutomationCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly cache: WorkspaceCacheService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!dataSource) throw new Error('Missing data source');
    const schema = getWorkspaceSchemaName(workspaceId);
    const { flatObjectMetadataMaps, flatApplicationMaps } =
      await this.cache.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatApplicationMaps',
      ]);
    const standard =
      flatApplicationMaps.idByUniversalIdentifier[
        TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER
      ];
    if (!standard) throw new Error('Missing Twenty standard application');
    const tableNames = Object.fromEntries(
      Object.values(flatObjectMetadataMaps.byUniversalIdentifier)
        .filter((object) => !!object)
        .map((object) => [
          object.nameSingular,
          computeTableName(
            object.nameSingular,
            object.applicationId !== standard,
          ),
        ]),
    );
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    const [{ installed }] = await runner.query(
      `SELECT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$1 AND p.proname='gainge_record_onboarding') AS installed`,
      [schema],
    );
    if (installed !== true || options.dryRun) {
      if (installed === true)
        this.logger.log(
          'Would reinstall contract automation and soft-delete automated co-consultant links',
        );
      await runner.release();
      return;
    }
    await runner.startTransaction();
    try {
      await runner.query("SET LOCAL lock_timeout='5s'");
      await runner.query("SET LOCAL statement_timeout='30s'");
      await runner.query(
        buildAutomationSql(
          schema,
          AUTOMATION_TARGETS.filter((target) => target.table === 'onboarding'),
          tableNames,
        ),
      );
      const [, removedCount] = await runner.query(
        buildAutomatedCollaboratorCleanupSql(
          schema,
          tableNames.gyeyagGuseongweonLink ?? '_gyeyagGuseongweonLink',
        ),
        [AUTOMATED_COLLABORATOR_NAME],
      );
      await runner.commitTransaction();
      this.logger.log(
        `Soft-deleted ${removedCount} automated co-consultant links`,
      );
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    this.logger.log('Contract edits no longer add co-consultants');
  }
}
