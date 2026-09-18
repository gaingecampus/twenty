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
  AUTOMATION_TARGETS,
  buildAutomationSql,
  buildBlankConsultantCleanupSql,
} from 'src/modules/gainge-automation/automation-schema';

// Stops making the editor of a contract its execution consultant, then clears
// contract consultants that point to missing or nameless team members.
@RegisteredWorkspaceCommand('2.23.0', 1806000000000)
@Command({
  name: 'upgrade:2-23:stop-onboarding-consultant-auto-assign',
  description:
    'Stop auto-assigning contract execution consultants and clear blank consultants.',
})
export class StopOnboardingConsultantAutoAssignCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
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
    const tableNames: Record<string, string> = Object.fromEntries(
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
          'Would stop contract consultant auto-assignment and clear blank consultants',
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
      await runner.query(
        buildBlankConsultantCleanupSql(schema, {
          onboarding: tableNames.onboarding ?? '_onboarding',
          teamMember: tableNames.teamMember ?? '_teamMember',
          link: tableNames.gyeyagGuseongweonLink ?? '_gyeyagGuseongweonLink',
        }),
      );
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    this.logger.log(
      'Contract consultants are no longer auto-assigned; blank consultants cleared',
    );
  }
}
