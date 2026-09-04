import { type ObjectLiteral } from 'typeorm';
import { actorCompositeType, type ActorMetadata } from 'twenty-shared/types';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';

import { buildCreatedByFromApiKey } from 'src/engine/core-modules/actor/utils/build-created-by-from-api-key.util';
import { buildCreatedByFromApplication } from 'src/engine/core-modules/actor/utils/build-created-by-from-application.util';
import { buildCreatedByFromFullNameMetadata } from 'src/engine/core-modules/actor/utils/build-created-by-from-full-name-metadata.util';
import { isApiKeyAuthContext } from 'src/engine/core-modules/auth/guards/is-api-key-auth-context.guard';
import { isApplicationAuthContext } from 'src/engine/core-modules/auth/guards/is-application-auth-context.guard';
import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { computeCompositeColumnName } from 'src/engine/metadata-modules/field-metadata/utils/compute-column-name.util';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { buildFieldMapsFromFlatObjectMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/build-field-maps-from-flat-object-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { computeObjectTargetTable } from 'src/engine/utils/compute-object-target-table.util';
import { escapeIdentifier } from 'src/engine/workspace-manager/workspace-migration/utils/remove-sql-injection.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

const UPDATED_BY_FIELD_NAME = 'updatedBy';

const getActorMetadataFromAuthContext = (
  authContext: WorkspaceAuthContext,
): ActorMetadata | undefined => {
  if (isUserAuthContext(authContext)) {
    return buildCreatedByFromFullNameMetadata({
      fullNameMetadata: authContext.workspaceMember.name,
      workspaceMemberId: authContext.workspaceMemberId,
    });
  }

  if (isApiKeyAuthContext(authContext)) {
    return buildCreatedByFromApiKey({
      apiKey: authContext.apiKey,
    });
  }

  if (isApplicationAuthContext(authContext)) {
    return buildCreatedByFromApplication({
      application: authContext.application,
    });
  }

  return undefined;
};

export const stampUpdatedByOnSoftDelete = async ({
  executeQuery,
  workspaceId,
  objectMetadata,
  flatFieldMetadataMaps,
  authContext,
  records,
}: {
  executeQuery: (sql: string, parameters?: unknown[]) => Promise<unknown>;
  workspaceId: string;
  objectMetadata: FlatObjectMetadata;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  authContext: WorkspaceAuthContext;
  records: ObjectLiteral[];
}): Promise<void> => {
  if (!isNonEmptyArray(records)) {
    return;
  }

  const { fieldIdByName } = buildFieldMapsFromFlatObjectMetadata(
    flatFieldMetadataMaps,
    objectMetadata,
  );

  if (!isDefined(fieldIdByName[UPDATED_BY_FIELD_NAME])) {
    return;
  }

  const actorMetadata = getActorMetadataFromAuthContext(authContext);

  if (!isDefined(actorMetadata)) {
    return;
  }

  const sourceProperty = actorCompositeType.properties.find(
    (property) => property.name === 'source',
  );
  const workspaceMemberIdProperty = actorCompositeType.properties.find(
    (property) => property.name === 'workspaceMemberId',
  );
  const nameProperty = actorCompositeType.properties.find(
    (property) => property.name === 'name',
  );
  const contextProperty = actorCompositeType.properties.find(
    (property) => property.name === 'context',
  );

  if (
    !isDefined(sourceProperty) ||
    !isDefined(workspaceMemberIdProperty) ||
    !isDefined(nameProperty) ||
    !isDefined(contextProperty)
  ) {
    return;
  }

  const sourceColumnName = computeCompositeColumnName(
    UPDATED_BY_FIELD_NAME,
    sourceProperty,
  );
  const workspaceMemberIdColumnName = computeCompositeColumnName(
    UPDATED_BY_FIELD_NAME,
    workspaceMemberIdProperty,
  );
  const nameColumnName = computeCompositeColumnName(
    UPDATED_BY_FIELD_NAME,
    nameProperty,
  );
  const contextColumnName = computeCompositeColumnName(
    UPDATED_BY_FIELD_NAME,
    contextProperty,
  );

  const schemaName = getWorkspaceSchemaName(workspaceId);
  const tableName = computeObjectTargetTable(objectMetadata);
  const recordIds = records
    .map((record) => record.id)
    .filter((recordId): recordId is string => typeof recordId === 'string');

  if (!isNonEmptyArray(recordIds)) {
    return;
  }

  const recordIdPlaceholders = recordIds
    .map((_, index) => `$${index + 5}::uuid`)
    .join(', ');

  await executeQuery(
    `UPDATE ${escapeIdentifier(schemaName)}.${escapeIdentifier(tableName)}
     SET ${escapeIdentifier(sourceColumnName)} = $1,
         ${escapeIdentifier(nameColumnName)} = $2,
         ${escapeIdentifier(workspaceMemberIdColumnName)} = $3,
         ${escapeIdentifier(contextColumnName)} = $4::jsonb
     WHERE id IN (${recordIdPlaceholders})`,
    [
      actorMetadata.source,
      actorMetadata.name,
      actorMetadata.workspaceMemberId,
      JSON.stringify(actorMetadata.context ?? {}),
      ...recordIds,
    ],
  );
};
