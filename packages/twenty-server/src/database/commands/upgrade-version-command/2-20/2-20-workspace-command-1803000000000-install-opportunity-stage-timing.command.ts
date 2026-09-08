import { Command } from 'nest-commander';
import { FieldMetadataType } from 'twenty-shared/types';
import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import {
  fields,
  buildStageTimingSql,
} from 'src/database/commands/upgrade-version-command/2-20/opportunity-stage-timing-schema';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

@RegisteredWorkspaceCommand('2.20.0', 1803000000000)
@Command({
  name: 'upgrade:2-20:install-opportunity-stage-timing',
  description:
    'Install first observed stage timing for GAINGE inquiries without backfilling history.',
})
export class InstallOpportunityStageTimingCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {
    super(workspaceIteratorService);
  }
  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!dataSource) throw new Error('Workspace data source missing');
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);
    const object = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).find((item) => item?.nameSingular === 'opportunity');
    if (!object) return;
    const existing = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
    ).filter((item) => item?.objectMetadataId === object.id);
    const stage = existing.find((item) => item?.name === 'customStage');
    if (!stage || stage.type !== FieldMetadataType.SELECT) return;
    const expectedStages = [
      'INQUIRY',
      'COMMUNICATING',
      'TECHNICAL_CONSULT',
      'PROPOSAL',
      'FOLLOW_UP',
      'ON_HOLD',
      'MATCHING_HOLD_COMPLETED',
      'MATCHING_SUCCESS',
    ];
    if (
      !stage.options?.length ||
      !stage.options.every((option) => expectedStages.includes(option.value))
    )
      return;
    for (const field of fields) {
      const match = existing.find((item) => item?.name === field.name);
      if (match && match.type !== field.type)
        throw new Error(`Stage timing field type conflict: ${field.name}`);
    }
    if (options.dryRun) {
      this.logger.log(
        `Would install stage timing for ${workspaceId}; no history backfill`,
      );
      return;
    }
    for (const field of fields) {
      if (!existing.some((item) => item?.name === field.name))
        await this.fieldMetadataService.createOneField({
          workspaceId,
          createFieldInput: {
            ...field,
            type: field.type as FieldMetadataType,
            objectMetadataId: object.id,
          },
        });
    }
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await runner.query("SET LOCAL lock_timeout = '5s'");
      await runner.query("SET LOCAL statement_timeout = '30s'");
      await runner.query(
        buildStageTimingSql(getWorkspaceSchemaName(workspaceId)),
      );
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    this.logger.log(
      `Stage timing installed for ${workspaceId}; existing history unchanged`,
    );
  }
}
