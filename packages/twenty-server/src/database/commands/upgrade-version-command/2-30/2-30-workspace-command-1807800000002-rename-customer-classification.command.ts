import { Command } from 'nest-commander';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceMetadataVersionService } from 'src/engine/metadata-modules/workspace-metadata-version/services/workspace-metadata-version.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

// Only display labels change; object names, record titles and identifiers stay intact.
const DISPLAY_COLUMNS = [
  ['objectMetadata', 'labelSingular'],
  ['objectMetadata', 'labelPlural'],
  ['fieldMetadata', 'label'],
  ['view', 'name'],
  ['pageLayoutWidget', 'title'],
  ['pageLayoutTab', 'title'],
  ['viewFieldGroup', 'name'],
  ['navigationMenuItem', 'name'],
] as const;

@RegisteredWorkspaceCommand('2.30.0', 1807800000002)
@Command({
  name: 'upgrade:2-30:rename-customer-classification',
  description: 'Rename legacy message-list display labels to 고객 분류.',
})
export class RenameCustomerClassificationCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly cache: WorkspaceCacheService,
    private readonly metadataVersion: WorkspaceMetadataVersionService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!dataSource) throw new Error('Missing data source');
    if (options.dryRun) {
      this.logger.log(
        'Would rename message-list display labels in this workspace',
      );
      return;
    }
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.startTransaction();
      for (const oldLabel of ['동반 고객 목록', '수신자 목록', '심방콜 목록']) {
        for (const [table, column] of DISPLAY_COLUMNS) {
          await runner.query(
            `UPDATE core."${table}" SET "${column}"=replace("${column}",$2,$3) WHERE "workspaceId"=$1 AND "${column}" LIKE $4`,
            [workspaceId, oldLabel, '고객 분류', `%${oldLabel}%`],
          );
        }
        // Update only display-label keys, never opaque custom metadata values.
        for (const [table, column, keys] of [
          [
            'objectMetadata',
            'standardOverrides',
            ['labelSingular', 'labelPlural'],
          ],
          ['fieldMetadata', 'standardOverrides', ['label']],
          ['pageLayoutWidget', 'overrides', ['title']],
          ['pageLayoutTab', 'overrides', ['title']],
        ] as const) {
          for (const key of keys) {
            await runner.query(
              `UPDATE core."${table}" SET "${column}"=jsonb_set("${column}",ARRAY[$2],to_jsonb(replace("${column}"->>$2,$3,$4))) WHERE "workspaceId"=$1 AND "${column}"->>$2 LIKE $5`,
              [workspaceId, key, oldLabel, '고객 분류', `%${oldLabel}%`],
            );
          }
        }
      }
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    await this.cache.invalidateAndRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatViewMaps',
      'flatViewFieldGroupMaps',
      'flatPageLayoutTabMaps',
      'flatPageLayoutWidgetMaps',
      'flatNavigationMenuItemMaps',
    ]);
    await this.metadataVersion.incrementMetadataVersion(workspaceId);
  }
}
