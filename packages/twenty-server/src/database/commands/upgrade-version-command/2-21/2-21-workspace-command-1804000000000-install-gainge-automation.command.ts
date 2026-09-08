import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';
import { computeTableName } from 'src/engine/utils/compute-table-name.util';
import { Command } from 'nest-commander';
import { FieldMetadataType } from 'twenty-shared/types';
import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  AUTOMATION_TARGETS,
  buildAutomationSql,
} from 'src/modules/gainge-automation/automation-schema';
import { COMPANY_ENRICHMENT_FIELDS } from 'src/modules/gainge-automation/enrichment.utils';
@RegisteredWorkspaceCommand('2.21.0', 1804000000000)
@Command({
  name: 'upgrade:2-21:install-gainge-automation',
  description:
    'Install transactional DRI assignment and durable CRM automation events.',
})
export class InstallGaingeAutomationCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly fields: FieldMetadataService,
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
    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatApplicationMaps,
    } = await this.cache.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatApplicationMaps',
    ]);
    const standard =
      flatApplicationMaps.idByUniversalIdentifier[
        TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER
      ];
    if (!standard) throw new Error('Missing Twenty standard application');
    const objects = Object.values(flatObjectMetadataMaps.byUniversalIdentifier);
    const fields = Object.values(flatFieldMetadataMaps.byUniversalIdentifier);
    const member = objects.find((o) => o?.nameSingular === 'teamMember');
    const company = objects.find((o) => o?.nameSingular === 'company');
    if (
      !member ||
      !company ||
      !fields.some(
        (f) =>
          f?.objectMetadataId === member.id &&
          f.name === 'workspaceMemberAccount',
      )
    )
      return;
    const targets = AUTOMATION_TARGETS.filter((t) => {
      const object = objects.find((o) => o?.nameSingular === t.table);
      const link = objects.find((o) => o?.nameSingular === t.link);
      return (
        object &&
        link &&
        fields.some(
          (f) =>
            f?.objectMetadataId === object.id &&
            f.name === t.dri.replace(/Id$/, ''),
        ) &&
        fields.some(
          (f) =>
            f?.objectMetadataId === link.id &&
            f.name === t.parent.replace(/Id$/, ''),
        ) &&
        fields.some(
          (f) => f?.objectMetadataId === link.id && f.name === 'guseongweon',
        )
      );
    });
    if (!targets.length) return;
    const additions = [
      ...COMPANY_ENRICHMENT_FIELDS.map((f) => ({
        ...f,
        objectMetadataId: company.id,
      })),
      {
        name: 'googleChatUserId',
        label: 'Google Chat 사용자 ID',
        type: 'TEXT',
        objectMetadataId: member.id,
      },
      {
        name: 'googleChatNotificationsEnabled',
        label: 'Google Chat 개별 알림',
        type: 'BOOLEAN',
        objectMetadataId: member.id,
      },
    ];
    for (const field of additions) {
      const existing = fields.find(
        (f) =>
          f?.objectMetadataId === field.objectMetadataId &&
          f.name === field.name,
      );
      if (existing && existing.type !== field.type)
        throw new Error(`Automation field conflict: ${field.name}`);
    }
    if (options.dryRun) {
      this.logger.log(
        `Would install automation on ${targets.map((t) => t.table).join(', ')}`,
      );
      return;
    }
    for (const field of additions) {
      if (
        !fields.some(
          (f) =>
            f?.objectMetadataId === field.objectMetadataId &&
            f.name === field.name,
        )
      )
        await this.fields.createOneField({
          workspaceId,
          createFieldInput: {
            ...field,
            type: field.type as FieldMetadataType,
            isNullable: true,
            description: 'CRM 자동화 관리 필드',
          },
        });
    }
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await runner.query("SET LOCAL lock_timeout='5s'");
      await runner.query("SET LOCAL statement_timeout='30s'");
      await runner.query(
        buildAutomationSql(
          getWorkspaceSchemaName(workspaceId),
          targets,
          Object.fromEntries(
            objects
              .filter((o) => !!o)
              .map((o) => [
                o.nameSingular,
                computeTableName(
                  o.nameSingular,
                  o.applicationId !== standard,
                ),
              ]),
          ),
        ),
      );
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    this.logger.log(
      `Installed automation on ${targets.map((t) => t.table).join(', ')} without backfilling existing records`,
    );
  }
}
