import { Command } from 'nest-commander';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';
import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTableName } from 'src/engine/utils/compute-table-name.util';
import {
  CONTRACT_GOAL_FIELDS,
  FIELD_VISIT_FIELDS,
  buildFieldVisitValidationSql,
} from './field-management-schema';

@RegisteredWorkspaceCommand('2.24.0', 1807000000000)
@Command({
  name: 'upgrade:2-24:install-field-management',
  description:
    'Add contract goals and field visit records to GAINGE workspaces.',
})
export class InstallFieldManagementCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly fields: FieldMetadataService,
    private readonly objects: ObjectMetadataService,
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
    const objects = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).filter((o) => !!o);
    const fields = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
    ).filter((f) => !!f);
    const contract = objects.find((o) => o.nameSingular === 'onboarding');
    if (
      !contract ||
      !objects.some((o) => o.nameSingular === 'teamMember') ||
      !fields.some(
        (f) =>
          f.objectMetadataId === contract.id &&
          f.name === 'executionConsultant',
      )
    )
      return;
    const existingVisit = objects.find((o) => o.nameSingular === 'fieldVisit');
    if (
      existingVisit &&
      (!existingVisit.isActive || existingVisit.namePlural !== 'fieldVisits')
    )
      throw new Error('Field visit object conflict');
    for (const [objectId, additions] of [
      [contract.id, CONTRACT_GOAL_FIELDS],
      [existingVisit?.id, FIELD_VISIT_FIELDS],
    ] as const) {
      for (const field of additions) {
        const existing = fields.find(
          (f) => f.objectMetadataId === objectId && f.name === field.name,
        );
        if (
          existing &&
          (existing.type !== field.type ||
            !existing.isActive ||
            (field.name === 'recordStatus' &&
              !['DRAFT', 'SUBMITTED'].every((value) =>
                existing.options?.some((option) => option.value === value),
              )))
        )
          throw new Error(`Field conflict: ${field.name}`);
      }
    }
    const relation = fields.find(
      (f) => f.objectMetadataId === existingVisit?.id && f.name === 'contract',
    );
    if (
      relation &&
      (relation.type !== FieldMetadataType.RELATION ||
        !relation.isActive ||
        !relation.settings ||
        !('relationType' in relation.settings) ||
        relation.settings.relationType !== RelationType.MANY_TO_ONE ||
        relation.relationTargetObjectMetadataId !== contract.id)
    )
      throw new Error('Field visit contract relation conflict');
    if (options.dryRun) {
      this.logger.log('Would add contract goals, field visits and validation');
      return;
    }
    const visit =
      existingVisit ??
      (await this.objects.createOneObject({
        workspaceId,
        createObjectInput: {
          nameSingular: 'fieldVisit',
          namePlural: 'fieldVisits',
          labelSingular: '현장 기록',
          labelPlural: '현장 기록',
          icon: 'IconMap',
          description: '계약별 현장 수행 기록',
        },
      }));
    for (const [objectId, additions] of [
      [contract.id, CONTRACT_GOAL_FIELDS],
      [visit.id, FIELD_VISIT_FIELDS],
    ] as const) {
      for (const field of additions) {
        if (
          fields.some(
            (f) => f.objectMetadataId === objectId && f.name === field.name,
          )
        )
          continue;
        await this.fields.createOneField({
          workspaceId,
          createFieldInput: {
            ...field,
            type: field.type as FieldMetadataType,
            objectMetadataId: objectId,
            isNullable: true,
            icon: 'IconNotes',
          },
        });
      }
    }
    if (!relation)
      await this.fields.createOneField({
        workspaceId,
        createFieldInput: {
          objectMetadataId: visit.id,
          name: 'contract',
          label: '계약',
          type: FieldMetadataType.RELATION,
          isNullable: true,
          relationCreationPayload: {
            type: RelationType.MANY_TO_ONE,
            targetObjectMetadataId: contract.id,
            targetFieldLabel: '현장 기록',
            targetFieldIcon: 'IconMap',
          },
        },
      });
    const standard =
      flatApplicationMaps.idByUniversalIdentifier[
        TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER
      ];
    if (!standard) throw new Error('Missing standard application');
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await runner.query("SET LOCAL lock_timeout='5s'");
      await runner.query(
        buildFieldVisitValidationSql(
          getWorkspaceSchemaName(workspaceId),
          computeTableName(
            visit.nameSingular,
            visit.applicationId !== standard,
          ),
          computeTableName(
            contract.nameSingular,
            contract.applicationId !== standard,
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
  }
}
