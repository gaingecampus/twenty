import { Injectable } from '@nestjs/common';

import { FieldMetadataType, type ObjectsPermissionsByRoleId } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';
import { ProcessAggregateHelper } from 'src/engine/api/graphql/graphql-query-runner/helpers/process-aggregate.helper';
import { GraphqlQueryParser } from 'src/engine/api/graphql/graphql-query-runner/graphql-query-parsers/graphql-query.parser';
import { getTargetObjectMetadataOrThrow } from 'src/engine/api/graphql/graphql-query-runner/utils/get-target-object-metadata.util';
import { getAvailableAggregationsFromObjectFields } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-available-aggregations-from-object-fields.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  type RelationRollupAggregateInput,
  type RelationRollupAggregateResultDTO,
  type RelationRollupAggregateValueDTO,
} from 'src/engine/core-modules/relation-rollup/dtos/relation-rollup-aggregates.dto';
import { buildAggregationFieldForRelationRollup } from 'src/engine/core-modules/relation-rollup/utils/build-aggregation-field-for-relation-rollup.util';
import { computeMorphOrRelationFieldJoinColumnName } from 'src/engine/metadata-modules/field-metadata/utils/compute-morph-or-relation-field-join-column-name.util';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';
import { GlobalWorkspaceDataSource } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config';
import { resolveRolePermissionConfig } from 'src/engine/twenty-orm/utils/resolve-role-permission-config.util';
import { isFieldMetadataEntityOfType } from 'src/engine/utils/is-field-metadata-of-type.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class RelationRollupAggregatesService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async computeRelationRollupAggregates({
    authContext,
    parentObjectNameSingular,
    parentRecordIds,
    rollups,
  }: {
    authContext: WorkspaceAuthContext;
    parentObjectNameSingular: string;
    parentRecordIds: string[];
    rollups: RelationRollupAggregateInput[];
  }): Promise<RelationRollupAggregateResultDTO[]> {
    if (rollups.length === 0 || parentRecordIds.length === 0) {
      return rollups.map((rollup) => ({
        rollupKey: rollup.rollupKey,
        values: [],
      }));
    }

    const workspaceId = authContext.workspace.id;

    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      rolesPermissions,
      userWorkspaceRoleMap,
      apiKeyRoleMap,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'rolesPermissions',
      'userWorkspaceRoleMap',
      'apiKeyRoleMap',
    ]);

    const { idByNameSingular } = buildObjectIdByNameMaps(flatObjectMetadataMaps);

    const parentObjectMetadataId = idByNameSingular[parentObjectNameSingular];

    if (!isDefined(parentObjectMetadataId)) {
      throw new Error(
        `Parent object metadata not found for ${parentObjectNameSingular}`,
      );
    }

    const parentObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: parentObjectMetadataId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    if (!isDefined(parentObjectMetadata)) {
      throw new Error(
        `Parent object metadata not found for ${parentObjectNameSingular}`,
      );
    }

    const rolePermissionConfig = resolveRolePermissionConfig({
      authContext,
      userWorkspaceRoleMap,
      apiKeyRoleMap,
    });

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const workspaceDataSource =
          await this.globalWorkspaceOrmManager.getGlobalWorkspaceDataSource();

        const results: RelationRollupAggregateResultDTO[] = [];

        for (const rollup of rollups) {
          results.push(
            await this.computeSingleRollup({
              rollup,
              parentObjectMetadata,
              parentRecordIds,
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
              rolesPermissions,
              rolePermissionConfig,
              workspaceDataSource,
            }),
          );
        }

        return results;
      },
      authContext,
    );
  }

  private async computeSingleRollup({
    rollup,
    parentObjectMetadata,
    parentRecordIds,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
    rolesPermissions,
    rolePermissionConfig,
    workspaceDataSource,
  }: {
    rollup: RelationRollupAggregateInput;
    parentObjectMetadata: FlatObjectMetadata;
    parentRecordIds: string[];
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
    rolesPermissions: ObjectsPermissionsByRoleId;
    rolePermissionConfig: RolePermissionConfig | null;
    workspaceDataSource: GlobalWorkspaceDataSource;
  }): Promise<RelationRollupAggregateResultDTO> {
    const emptyResult = (): RelationRollupAggregateResultDTO => ({
      rollupKey: rollup.rollupKey,
      values: parentRecordIds.map((parentRecordId) => ({
        parentRecordId,
        aggregateFieldKey: 'totalCount',
        value: null,
      })),
    });

    const relationFieldMetadata = findFlatEntityByUniversalIdentifier({
      flatEntityMaps: flatFieldMetadataMaps,
      universalIdentifier: rollup.relationFieldMetadataUniversalIdentifier,
    });

    if (!isDefined(relationFieldMetadata)) {
      return emptyResult();
    }

    if (
      !isFieldMetadataEntityOfType(
        relationFieldMetadata,
        FieldMetadataType.RELATION,
      )
    ) {
      return emptyResult();
    }

    if (
      relationFieldMetadata.settings?.relationType !== RelationType.ONE_TO_MANY
    ) {
      return emptyResult();
    }

    if (!parentObjectMetadata.fieldIds.includes(relationFieldMetadata.id)) {
      return emptyResult();
    }

    const targetObjectMetadata = getTargetObjectMetadataOrThrow(
      relationFieldMetadata,
      flatObjectMetadataMaps,
    );

    const roleId =
      isDefined(rolePermissionConfig) &&
      'intersectionOf' in rolePermissionConfig
        ? rolePermissionConfig.intersectionOf[0]
        : undefined;
    const objectPermissions =
      isDefined(roleId) && isDefined(rolesPermissions[roleId])
        ? rolesPermissions[roleId][targetObjectMetadata.id]
        : undefined;

    if (
      objectPermissions !== undefined &&
      objectPermissions.canReadObjectRecords === false
    ) {
      return emptyResult();
    }

    const targetRelation = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: relationFieldMetadata.relationTargetFieldMetadataId ?? '',
      flatEntityMaps: flatFieldMetadataMaps,
    });

    if (!isDefined(targetRelation)) {
      return emptyResult();
    }

    const targetRelationName = targetRelation.name;

    const fieldMetadataTargetRelationColumnName =
      computeMorphOrRelationFieldJoinColumnName({
        name: targetRelationName,
      });

    const column = `"${fieldMetadataTargetRelationColumnName}"`;

    const childFields = targetObjectMetadata.fieldIds
      .map((fieldId) =>
        findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: fieldId,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
      )
      .filter(isDefined);

    const availableAggregations =
      getAvailableAggregationsFromObjectFields(childFields);

    let aggregateFieldMetadata: FlatFieldMetadata | undefined;

    if (isDefined(rollup.aggregateFieldMetadataUniversalIdentifier)) {
      aggregateFieldMetadata = findFlatEntityByUniversalIdentifier({
        flatEntityMaps: flatFieldMetadataMaps,
        universalIdentifier: rollup.aggregateFieldMetadataUniversalIdentifier,
      });
    }

    const { aggregateFieldKey, aggregationField } =
      buildAggregationFieldForRelationRollup({
        aggregateOperation: rollup.aggregateOperation,
        aggregateFieldMetadata,
        availableAggregations,
      });

    const targetObjectRepository = workspaceDataSource.getRepository(
      targetObjectMetadata.nameSingular,
      rolePermissionConfig ?? undefined,
    );

    const targetObjectQueryBuilder = targetObjectRepository.createQueryBuilder(
      targetObjectMetadata.nameSingular,
    );

    const graphqlQueryParser = new GraphqlQueryParser(
      targetObjectMetadata,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    );

    const recordFilter: Partial<ObjectRecordFilter> = rollup.filter ?? {};

    graphqlQueryParser.applyFilterToBuilder(
      targetObjectQueryBuilder,
      targetObjectMetadata.nameSingular,
      recordFilter,
    );

    graphqlQueryParser.applyDeletedAtToBuilder(
      targetObjectQueryBuilder,
      recordFilter,
    );

    const aggregateQueryBuilder = targetObjectQueryBuilder.clone();

    ProcessAggregateHelper.addSelectedAggregatedFieldsQueriesToQueryBuilder({
      selectedAggregatedFields: {
        [aggregateFieldKey]: aggregationField,
      },
      queryBuilder: aggregateQueryBuilder,
      objectMetadataNameSingular: targetObjectMetadata.nameSingular,
    });

    const aggregatedFieldsValues = await aggregateQueryBuilder
      .addSelect(column)
      .where(`${column} IN (:...parentRecordIds)`, {
        parentRecordIds,
      })
      .groupBy(column)
      .getRawMany<ObjectLiteral>();

    const valuesByParentId = aggregatedFieldsValues.reduce<
      Record<string, string | number | null>
    >((accumulator, item) => {
      const columnWithoutQuotes = fieldMetadataTargetRelationColumnName;
      const parentId = item[columnWithoutQuotes] as string;
      const rawValue = item[aggregateFieldKey];

      accumulator[parentId] =
        rawValue === null || rawValue === undefined
          ? null
          : (rawValue as string | number);

      return accumulator;
    }, {});

    const values: RelationRollupAggregateValueDTO[] = parentRecordIds.map(
      (parentRecordId) => ({
        parentRecordId,
        aggregateFieldKey,
        value: valuesByParentId[parentRecordId] ?? null,
      }),
    );

    return {
      rollupKey: rollup.rollupKey,
      values,
    };
  }
}
