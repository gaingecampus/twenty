import { Command } from 'nest-commander';
import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { quoteAutomationSchema } from 'src/modules/gainge-automation/automation-schema';

@RegisteredWorkspaceCommand('2.29.0', 1807600000001)
@Command({
  name: 'upgrade:2-29:company-dri-insert-only',
  description: 'Assign company DRI only on creation.',
})
export class CompanyDriInsertOnlyCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
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
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.startTransaction();
      await runner.query("SET LOCAL lock_timeout='5s'");
      await runner.query("SET LOCAL statement_timeout='30s'");
      // Locate installed triggers by function, including renamed/custom tables.
      const triggers: { tableName: string; triggerName: string }[] =
        await runner.query(
          `SELECT c.relname AS "tableName", t.tgname AS "triggerName" FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid WHERE n.nspname=$1 AND p.proname='gainge_assign_company' AND NOT t.tgisinternal`,
          [schema],
        );
      if (options.dryRun) {
        this.logger.log(
          `Would restrict ${triggers.length} company DRI assignment triggers to INSERT`,
        );
        await runner.rollbackTransaction();
        return;
      }
      for (const trigger of triggers) {
        const table = `${quoteAutomationSchema(schema)}.${quoteAutomationSchema(trigger.tableName)}`;
        const name = quoteAutomationSchema(trigger.triggerName);
        await runner.query(`DROP TRIGGER IF EXISTS ${name} ON ${table}`);
        await runner.query(
          `CREATE TRIGGER ${name} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${quoteAutomationSchema(schema)}.gainge_assign_company()`,
        );
      }
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    this.logger.log(
      'Company DRI assigned only on creation; existing assignments preserved',
    );
  }
}
