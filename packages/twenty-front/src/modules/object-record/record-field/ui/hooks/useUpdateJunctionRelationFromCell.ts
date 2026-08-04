import { useCallback } from 'react';
import { useStore } from 'jotai';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getObjectTypename } from '@/object-record/cache/utils/getObjectTypename';
import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { type RecordGqlOperationFindManyResult } from '@/object-record/graphql/types/RecordGqlOperationFindManyResult';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import { useRestoreManyRecords } from '@/object-record/hooks/useRestoreManyRecords';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import {
  type FieldRelationFromManyValue,
  type FieldRelationMetadata,
  type FieldRelationValue,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { findJunctionRecordByTargetId } from '@/object-record/record-field/ui/utils/junction/findJunctionRecordByTargetId';
import { findTargetFieldInfo } from '@/object-record/record-field/ui/utils/junction/findTargetFieldInfo';
import { getJunctionConfig } from '@/object-record/record-field/ui/utils/junction/getJunctionConfig';
import { getSourceJoinColumnName } from '@/object-record/record-field/ui/utils/junction/getSourceJoinColumnName';
import { searchRecordStoreFamilyState } from '@/object-record/record-picker/multiple-record-picker/states/searchRecordStoreComponentFamilyState';
import { type RecordPickerPickableMorphItem } from '@/object-record/record-picker/types/RecordPickerPickableMorphItem';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

type UseUpdateJunctionRelationFromCellArgs = {
  fieldMetadataItem: FieldMetadataItem;
  fieldDefinition: FieldDefinition<FieldRelationMetadata>;
  recordId: string;
};

const replaceJunctionRecordInStore = ({
  store,
  recordId,
  fieldName,
  previousJunctionId,
  nextJunctionRecord,
}: {
  store: ReturnType<typeof useStore>;
  recordId: string;
  fieldName: string;
  previousJunctionId: string;
  nextJunctionRecord: ObjectRecord;
}) => {
  store.set(
    recordStoreFamilyState.atomFamily(recordId),
    (currentRecord: ObjectRecord | null | undefined) => {
      if (!isDefined(currentRecord)) {
        return currentRecord;
      }

      const currentFieldValue = currentRecord[fieldName];
      const updatedJunctionRecords = Array.isArray(currentFieldValue)
        ? currentFieldValue.map((junctionRecord) =>
            junctionRecord?.id === previousJunctionId
              ? nextJunctionRecord
              : junctionRecord,
          )
        : [nextJunctionRecord];

      return {
        ...currentRecord,
        [fieldName]: updatedJunctionRecords,
      };
    },
  );
};

const removeJunctionRecordFromStore = ({
  store,
  recordId,
  fieldName,
  junctionRecordId,
}: {
  store: ReturnType<typeof useStore>;
  recordId: string;
  fieldName: string;
  junctionRecordId: string;
}) => {
  store.set(
    recordStoreFamilyState.atomFamily(recordId),
    (currentRecord: ObjectRecord | null | undefined) => {
      if (!isDefined(currentRecord)) {
        return currentRecord;
      }

      const currentFieldValue = currentRecord[fieldName];

      if (!Array.isArray(currentFieldValue)) {
        return currentRecord;
      }

      return {
        ...currentRecord,
        [fieldName]: currentFieldValue.filter(
          (junctionRecord) => junctionRecord?.id !== junctionRecordId,
        ),
      };
    },
  );
};

export const useUpdateJunctionRelationFromCell = ({
  fieldMetadataItem,
  fieldDefinition,
  recordId,
}: UseUpdateJunctionRelationFromCellArgs) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const apolloCoreClient = useApolloCoreClient();

  const sourceObjectMetadata = objectMetadataItems.find(
    (item) =>
      item.nameSingular === fieldDefinition.metadata.objectMetadataNameSingular,
  );

  const junctionConfig = getJunctionConfig({
    settings: fieldMetadataItem.settings,
    relationObjectMetadataId: fieldDefinition.metadata.relationObjectMetadataId,
    sourceObjectMetadataId: sourceObjectMetadata?.id,
    objectMetadataItems,
  });

  const junctionObjectMetadata = junctionConfig?.junctionObjectMetadata;
  const sourceFieldOnJunction = junctionConfig?.sourceField;

  // Use relation object name as fallback to prevent hook errors (hooks can't be conditional)
  const junctionObjectNameSingular =
    junctionObjectMetadata?.nameSingular ??
    fieldDefinition.metadata.relationObjectMetadataNameSingular;

  // Skip the post-optimistic effect since we handle optimistic updates manually
  // Otherwise Apollo would also add the record, resulting in duplicates
  const { createOneRecord: createJunctionRecord } = useCreateOneRecord({
    objectNameSingular: junctionObjectNameSingular,
    skipPostOptimisticEffect: true,
  });

  const { deleteOneRecord: deleteJunctionRecord } = useDeleteOneRecord({
    objectNameSingular: junctionObjectNameSingular,
  });

  const { restoreManyRecords } = useRestoreManyRecords({
    objectNameSingular: junctionObjectNameSingular,
  });

  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular: junctionObjectNameSingular,
    recordGqlFields: {
      id: true,
      deletedAt: true,
    },
  });

  const store = useStore();
  const updateJunctionRelationFromCell = useCallback(
    async ({ morphItem }: { morphItem: RecordPickerPickableMorphItem }) => {
      const targetFields = junctionConfig?.targetFields;

      if (
        !isDefined(junctionObjectMetadata) ||
        !isDefined(sourceFieldOnJunction) ||
        !isDefined(targetFields) ||
        targetFields.length === 0
      ) {
        return;
      }

      if (!isDefined(sourceObjectMetadata)) {
        return;
      }

      const sourceJoinColumnName = getSourceJoinColumnName({
        sourceField: sourceFieldOnJunction,
        sourceObjectMetadata,
      });

      const fieldName = fieldDefinition.metadata.fieldName;
      const junctionObjectName = junctionObjectMetadata.nameSingular;

      const targetFieldInfo = findTargetFieldInfo(
        targetFields,
        morphItem.objectMetadataId,
        objectMetadataItems,
      );

      if (!isDefined(targetFieldInfo)) {
        return;
      }

      const targetFieldName = targetFieldInfo.fieldName;
      const targetJoinColumnName = targetFieldInfo.joinColumnName;

      if (
        !isDefined(sourceJoinColumnName) ||
        !isDefined(targetJoinColumnName)
      ) {
        return;
      }

      const recordFromStore = store.get(
        recordStoreFamilyState.atomFamily(recordId),
      );
      const currentJunctionRecords =
        (recordFromStore?.[fieldName] as
          | FieldRelationValue<FieldRelationFromManyValue>
          | undefined) ?? [];

      // morphItem.isSelected represents the NEW state (what the user wants)
      if (!morphItem.isSelected) {
        const junctionRecordToDelete = findJunctionRecordByTargetId({
          junctionRecords: currentJunctionRecords,
          targetRecordId: morphItem.recordId,
          targetFieldName,
          targetJoinColumnName,
        });

        if (!isDefined(junctionRecordToDelete)) {
          return;
        }

        await deleteJunctionRecord(junctionRecordToDelete.id);

        removeJunctionRecordFromStore({
          store,
          recordId,
          fieldName,
          junctionRecordId: junctionRecordToDelete.id,
        });
      } else {
        const existingJunctionRecord = findJunctionRecordByTargetId({
          junctionRecords: currentJunctionRecords,
          targetRecordId: morphItem.recordId,
          targetFieldName,
          targetJoinColumnName,
        });

        // Already linked in the store — avoid duplicate INSERT
        if (isDefined(existingJunctionRecord)) {
          return;
        }

        const searchRecord = store.get(
          searchRecordStoreFamilyState.atomFamily(morphItem.recordId),
        );

        if (!isDefined(searchRecord?.record)) {
          return;
        }

        const targetRecord = searchRecord.record;
        const newJunctionId = v4();
        const now = new Date().toISOString();

        const junctionRecordForStore = {
          id: newJunctionId,
          createdAt: now,
          updatedAt: now,
          __typename: getObjectTypename(junctionObjectName),
          [sourceJoinColumnName]: recordId,
          [targetJoinColumnName]: morphItem.recordId,
          [targetFieldName]: targetRecord,
        };

        const newJunctionRecordForApi = {
          id: newJunctionId,
          [sourceJoinColumnName]: recordId,
          [targetJoinColumnName]: morphItem.recordId,
        };

        store.set(
          recordStoreFamilyState.atomFamily(recordId),
          (currentRecord: ObjectRecord | null | undefined) => {
            if (!isDefined(currentRecord)) {
              return currentRecord;
            }

            const currentFieldValue = currentRecord[fieldName];
            const updatedJunctionRecords = Array.isArray(currentFieldValue)
              ? [...currentFieldValue, junctionRecordForStore]
              : [junctionRecordForStore];

            return {
              ...currentRecord,
              [fieldName]: updatedJunctionRecords,
            };
          },
        );

        try {
          await createJunctionRecord(newJunctionRecordForApi);
        } catch (error) {
          // Soft-deleted or already-active link may still exist in DB
          const softDeleteInclusiveFilter = {
            and: [
              { [sourceJoinColumnName]: { eq: recordId } },
              { [targetJoinColumnName]: { eq: morphItem.recordId } },
              {
                or: [
                  { deletedAt: { is: 'NULL' } },
                  { deletedAt: { is: 'NOT_NULL' } },
                ],
              },
            ],
          };

          const existingLinksResult =
            await apolloCoreClient.query<RecordGqlOperationFindManyResult>({
              query: findManyRecordsQuery,
              variables: {
                filter: softDeleteInclusiveFilter,
                limit: 1,
              },
              fetchPolicy: 'network-only',
            });

          const existingLinks = getRecordsFromRecordConnection({
            recordConnection: {
              edges:
                existingLinksResult.data?.[junctionObjectMetadata.namePlural]
                  ?.edges ?? [],
              pageInfo: existingLinksResult.data?.[
                junctionObjectMetadata.namePlural
              ]?.pageInfo ?? {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: '',
                endCursor: '',
              },
            },
          });

          const existingLink = existingLinks[0];

          if (!isDefined(existingLink)) {
            removeJunctionRecordFromStore({
              store,
              recordId,
              fieldName,
              junctionRecordId: newJunctionId,
            });
            throw error;
          }

          if (isDefined(existingLink.deletedAt)) {
            await restoreManyRecords({
              idsToRestore: [existingLink.id],
            });
          }

          replaceJunctionRecordInStore({
            store,
            recordId,
            fieldName,
            previousJunctionId: newJunctionId,
            nextJunctionRecord: {
              ...junctionRecordForStore,
              id: existingLink.id,
              deletedAt: null,
            },
          });
        }
      }
    },
    [
      apolloCoreClient,
      createJunctionRecord,
      deleteJunctionRecord,
      fieldDefinition.metadata.fieldName,
      findManyRecordsQuery,
      junctionConfig,
      junctionObjectMetadata,
      objectMetadataItems,
      recordId,
      restoreManyRecords,
      sourceFieldOnJunction,
      sourceObjectMetadata,
      store,
    ],
  );

  const isJunctionConfigValid =
    isDefined(junctionConfig) &&
    isDefined(sourceFieldOnJunction) &&
    isDefined(junctionConfig.targetFields) &&
    junctionConfig.targetFields.length > 0;

  return {
    updateJunctionRelationFromCell,
    isJunctionConfigValid,
  };
};
