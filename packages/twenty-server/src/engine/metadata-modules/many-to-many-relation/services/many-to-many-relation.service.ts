import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import {
  computeMetadataNameFromLabel,
  computeMetadataNamesFromLabelsOrThrow,
} from 'twenty-shared/metadata';
import { MAX_CUSTOM_INDEXES_PER_OBJECT } from 'twenty-shared/constants';
import {
  FeatureFlagKey,
  FieldMetadataType,
  RelationType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import {
  FieldMetadataException,
  FieldMetadataExceptionCode,
} from 'src/engine/metadata-modules/field-metadata/field-metadata.exception';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { findFlatEntityByIdInFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps-or-throw.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { isMorphOrRelationFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-morph-or-relation-flat-field-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import {
  IndexMetadataException,
  IndexMetadataExceptionCode,
} from 'src/engine/metadata-modules/index-metadata/index-field-metadata.exception';
import { IndexMetadataService } from 'src/engine/metadata-modules/index-metadata/services/index-metadata.service';
import { IndexType } from 'src/engine/metadata-modules/index-metadata/types/indexType.types';
import { generateFlatIndexMetadataWithNameOrThrow } from 'src/engine/metadata-modules/index-metadata/utils/generate-flat-index.util';
import { type CreateManyToManyRelationInput } from 'src/engine/metadata-modules/many-to-many-relation/dtos/create-many-to-many-relation.input';
import { buildDefaultJunctionObjectLabels } from 'src/engine/metadata-modules/many-to-many-relation/utils/build-default-junction-object-labels.util';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const JUNCTION_UNIQUE_INDEX_WHERE_CLAUSE = '"deletedAt" IS NULL';

export type CreateManyToManyRelationResult = {
  sourceField: FlatFieldMetadata;
  targetField: FlatFieldMetadata;
  junctionObject: FlatObjectMetadata;
};

@Injectable()
export class ManyToManyRelationService {
  constructor(
    private readonly featureFlagService: FeatureFlagService,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly indexMetadataService: IndexMetadataService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {}

  async createManyToManyRelation({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: CreateManyToManyRelationInput;
  }): Promise<CreateManyToManyRelationResult> {
    const isJunctionRelationsEnabled =
      await this.featureFlagService.isFeatureEnabled(
        FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED,
        workspaceId,
      );

    if (!isJunctionRelationsEnabled) {
      throw new FieldMetadataException(
        'Junction relations are not enabled for this workspace',
        FieldMetadataExceptionCode.FIELD_METADATA_RELATION_NOT_ENABLED,
        {
          userFriendlyMessage: msg`Enable Junction Relations in Settings → Community → Features to create many-to-many relations.`,
        },
      );
    }

    if (input.sourceObjectMetadataId === input.targetObjectMetadataId) {
      throw new FieldMetadataException(
        'Self-referential many-to-many relations are not supported',
        FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
        {
          userFriendlyMessage: msg`Many-to-many relations cannot point to the same object.`,
        },
      );
    }

    const { flatObjectMetadataMaps: existingFlatObjectMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps'],
        },
      );

    const sourceObjectMetadata = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: input.sourceObjectMetadataId,
      flatEntityMaps: existingFlatObjectMetadataMaps,
    });

    const targetObjectMetadata = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: input.targetObjectMetadataId,
      flatEntityMaps: existingFlatObjectMetadataMaps,
    });

    const defaultJunctionLabels = buildDefaultJunctionObjectLabels({
      sourceLabelSingular: sourceObjectMetadata.labelSingular,
      targetLabelSingular: targetObjectMetadata.labelSingular,
    });

    const junctionLabelSingular =
      input.junctionLabelSingular ?? defaultJunctionLabels.labelSingular;
    const junctionLabelPlural =
      input.junctionLabelPlural ?? defaultJunctionLabels.labelPlural;

    const {
      nameSingular: junctionNameSingular,
      namePlural: junctionNamePlural,
    } = computeMetadataNamesFromLabelsOrThrow({
      labelSingular: junctionLabelSingular,
      labelPlural: junctionLabelPlural,
    });

    const junctionObject = await this.objectMetadataService.createOneObject({
      workspaceId,
      createObjectInput: {
        nameSingular: junctionNameSingular,
        namePlural: junctionNamePlural,
        labelSingular: junctionLabelSingular,
        labelPlural: junctionLabelPlural,
        icon: input.junctionIcon ?? 'IconLink',
        skipNameField: true,
        isLabelSyncedWithName: true,
        description: `Junction object linking ${sourceObjectMetadata.labelPlural} and ${targetObjectMetadata.labelPlural}`,
      },
    });

    const sourceFieldIcon = input.sourceFieldIcon ?? 'IconRelationManyToMany';
    const targetFieldIcon = input.targetFieldIcon ?? 'IconRelationManyToMany';

    const sourceFieldName = computeMetadataNameFromLabel({
      label: input.sourceFieldLabel,
    });
    const targetFieldName = computeMetadataNameFromLabel({
      label: input.targetFieldLabel,
    });

    const [sourceField, targetField] =
      await this.fieldMetadataService.createManyFields({
        workspaceId,
        createFieldInputs: [
          {
            type: FieldMetadataType.RELATION,
            name: sourceFieldName,
            label: input.sourceFieldLabel,
            icon: sourceFieldIcon,
            objectMetadataId: input.sourceObjectMetadataId,
            isLabelSyncedWithName: true,
            relationCreationPayload: {
              type: RelationType.ONE_TO_MANY,
              targetObjectMetadataId: junctionObject.id,
              targetFieldLabel: sourceObjectMetadata.labelSingular,
              targetFieldIcon: sourceObjectMetadata.icon ?? 'Icon123',
            },
          },
          {
            type: FieldMetadataType.RELATION,
            name: targetFieldName,
            label: input.targetFieldLabel,
            icon: targetFieldIcon,
            objectMetadataId: input.targetObjectMetadataId,
            isLabelSyncedWithName: true,
            relationCreationPayload: {
              type: RelationType.ONE_TO_MANY,
              targetObjectMetadataId: junctionObject.id,
              targetFieldLabel: targetObjectMetadata.labelSingular,
              targetFieldIcon: targetObjectMetadata.icon ?? 'Icon123',
            },
          },
        ],
      });

    if (!isDefined(sourceField) || !isDefined(targetField)) {
      throw new FieldMetadataException(
        'Failed to create many-to-many relation fields',
        FieldMetadataExceptionCode.INTERNAL_SERVER_ERROR,
      );
    }

    // ONE_TO_MANY source.relationTargetFieldMetadataId = junction M2O → source
    // ONE_TO_MANY target.relationTargetFieldMetadataId = junction M2O → target
    const junctionJoinFieldPointingToSource =
      sourceField.relationTargetFieldMetadataId;
    const junctionJoinFieldPointingToTarget =
      targetField.relationTargetFieldMetadataId;

    if (
      !isDefined(junctionJoinFieldPointingToSource) ||
      !isDefined(junctionJoinFieldPointingToTarget)
    ) {
      throw new FieldMetadataException(
        'Failed to resolve junction join fields for many-to-many relation',
        FieldMetadataExceptionCode.FIELD_METADATA_RELATION_MALFORMED,
      );
    }

    await Promise.all([
      this.fieldMetadataService.updateOneField({
        workspaceId,
        updateFieldInput: {
          id: sourceField.id,
          settings: {
            relationType: RelationType.ONE_TO_MANY,
            junctionTargetFieldId: junctionJoinFieldPointingToTarget,
          },
        },
      }),
      this.fieldMetadataService.updateOneField({
        workspaceId,
        updateFieldInput: {
          id: targetField.id,
          settings: {
            relationType: RelationType.ONE_TO_MANY,
            junctionTargetFieldId: junctionJoinFieldPointingToSource,
          },
        },
      }),
    ]);

    await this.createUniqueCompositeIndexOnJunctionJoinFields({
      workspaceId,
      junctionObjectId: junctionObject.id,
      junctionSourceJoinFieldId: junctionJoinFieldPointingToSource,
      junctionTargetJoinFieldId: junctionJoinFieldPointingToTarget,
    });

    const { flatFieldMetadataMaps: recomputedFlatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatFieldMetadataMaps'],
        },
      );

    const refreshedSourceField = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: sourceField.id,
      flatEntityMaps: recomputedFlatFieldMetadataMaps,
    });

    const refreshedTargetField = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: targetField.id,
      flatEntityMaps: recomputedFlatFieldMetadataMaps,
    });

    return {
      sourceField: refreshedSourceField,
      targetField: refreshedTargetField,
      junctionObject,
    };
  }

  async repairJunctionUniqueIndex({
    workspaceId,
    junctionObjectMetadataId,
  }: {
    workspaceId: string;
    junctionObjectMetadataId: string;
  }): Promise<boolean> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const junctionObjectMetadata = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: junctionObjectMetadataId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    const manyToOneJoinFieldIds = junctionObjectMetadata.fieldIds
      .map((fieldId) =>
        findFlatEntityByIdInFlatEntityMapsOrThrow({
          flatEntityId: fieldId,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
      )
      .filter(
        (field) =>
          isMorphOrRelationFlatFieldMetadata(field) &&
          field.settings?.relationType === RelationType.MANY_TO_ONE,
      )
      .map((field) => field.id);

    if (manyToOneJoinFieldIds.length < 2) {
      throw new FieldMetadataException(
        'Junction object must have at least two many-to-one relation fields',
        FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
        {
          userFriendlyMessage: msg`This object does not look like a many-to-many junction object.`,
        },
      );
    }

    await this.createUniqueCompositeIndexOnJunctionJoinFields({
      workspaceId,
      junctionObjectId: junctionObjectMetadataId,
      junctionSourceJoinFieldId: manyToOneJoinFieldIds[0],
      junctionTargetJoinFieldId: manyToOneJoinFieldIds[1],
    });

    return true;
  }

  private async createUniqueCompositeIndexOnJunctionJoinFields({
    workspaceId,
    junctionObjectId,
    junctionSourceJoinFieldId,
    junctionTargetJoinFieldId,
  }: {
    workspaceId: string;
    junctionObjectId: string;
    junctionSourceJoinFieldId: string;
    junctionTargetJoinFieldId: string;
  }): Promise<void> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps, flatIndexMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: [
            'flatObjectMetadataMaps',
            'flatFieldMetadataMaps',
            'flatIndexMaps',
          ],
        },
      );

    const junctionObjectMetadata = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: junctionObjectId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    const sourceJoinField = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: junctionSourceJoinFieldId,
      flatEntityMaps: flatFieldMetadataMaps,
    });

    const targetJoinField = findFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityId: junctionTargetJoinFieldId,
      flatEntityMaps: flatFieldMetadataMaps,
    });

    const expectedFieldIds = new Set([
      junctionSourceJoinFieldId,
      junctionTargetJoinFieldId,
    ]);

    const matchingUniqueIndexes = Object.values(
      flatIndexMaps.byUniversalIdentifier,
    ).filter((flatIndex) => {
      if (
        !isDefined(flatIndex) ||
        flatIndex.objectMetadataId !== junctionObjectId ||
        !flatIndex.isUnique ||
        !flatIndex.isCustom
      ) {
        return false;
      }

      const indexFieldIds = new Set(
        flatIndex.flatIndexFieldMetadatas.map(
          (indexField) => indexField.fieldMetadataId,
        ),
      );

      if (indexFieldIds.size !== expectedFieldIds.size) {
        return false;
      }

      for (const fieldId of expectedFieldIds) {
        if (!indexFieldIds.has(fieldId)) {
          return false;
        }
      }

      return true;
    });

    const compatibleIndex = matchingUniqueIndexes.find(
      (flatIndex) =>
        flatIndex?.indexWhereClause === JUNCTION_UNIQUE_INDEX_WHERE_CLAUSE,
    );

    if (isDefined(compatibleIndex)) {
      return;
    }

    for (const incompatibleIndex of matchingUniqueIndexes) {
      if (!isDefined(incompatibleIndex)) {
        continue;
      }

      await this.indexMetadataService.deleteOne({
        id: incompatibleIndex.id,
        workspaceId,
      });
    }

    const { flatIndexMaps: refreshedFlatIndexMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatIndexMaps'],
        },
      );

    const existingCustomIndexCount = Object.values(
      refreshedFlatIndexMaps.byUniversalIdentifier,
    ).filter(
      (flatIndex) =>
        isDefined(flatIndex) &&
        flatIndex.objectMetadataId === junctionObjectId &&
        flatIndex.isCustom,
    ).length;

    if (existingCustomIndexCount >= MAX_CUSTOM_INDEXES_PER_OBJECT) {
      throw new IndexMetadataException(
        `Custom index limit of ${MAX_CUSTOM_INDEXES_PER_OBJECT} reached for object ${junctionObjectId}`,
        IndexMetadataExceptionCode.CUSTOM_INDEX_LIMIT_REACHED,
        {
          userFriendlyMessage: msg`You can have at most ${MAX_CUSTOM_INDEXES_PER_OBJECT} custom indexes per object. Delete one before creating a new one.`,
        },
      );
    }

    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const indexMetadataUniversalIdentifier = v4();
    const createdAt = new Date().toISOString();

    const universalFlatIndexMetadata = generateFlatIndexMetadataWithNameOrThrow(
      {
        flatObjectMetadata: junctionObjectMetadata,
        objectFlatFieldMetadatas: [sourceJoinField, targetJoinField],
        flatIndex: {
          createdAt,
          updatedAt: createdAt,
          indexType: IndexType.BTREE,
          // Soft-deleted junction rows must not block re-linking the same pair
          indexWhereClause: JUNCTION_UNIQUE_INDEX_WHERE_CLAUSE,
          isCustom: true,
          isUnique: true,
          isSystemSideEffect: false,
          objectMetadataUniversalIdentifier:
            junctionObjectMetadata.universalIdentifier,
          universalIdentifier: indexMetadataUniversalIdentifier,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
          universalFlatIndexFieldMetadatas: [
            {
              createdAt,
              updatedAt: createdAt,
              order: 0,
              subFieldName: null,
              fieldMetadataUniversalIdentifier:
                sourceJoinField.universalIdentifier,
              indexMetadataUniversalIdentifier,
            },
            {
              createdAt,
              updatedAt: createdAt,
              order: 1,
              subFieldName: null,
              fieldMetadataUniversalIdentifier:
                targetJoinField.universalIdentifier,
              indexMetadataUniversalIdentifier,
            },
          ],
        },
      },
    );

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            index: {
              flatEntityToCreate: [universalFlatIndexMetadata],
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
          workspaceId,
          isSystemBuild: false,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        validateAndBuildResult,
        'Failed to create unique composite index on junction object',
      );
    }
  }
}
