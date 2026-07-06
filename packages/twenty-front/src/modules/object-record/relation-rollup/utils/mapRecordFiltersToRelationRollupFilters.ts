import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { type RecordFilterGroup } from '@/object-record/record-filter-group/types/RecordFilterGroup';
import { mapRecordFilterGroupLogicalOperatorToViewFilterGroupLogicalOperator } from '@/views/utils/mapRecordFilterGroupLogicalOperatorToViewFilterGroupLogicalOperator';
import {
  type RelationRollupFilterGroupSnapshot,
  type RelationRollupFilterSnapshot,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const mapRecordFiltersToRelationRollupFilters = ({
  recordFilters,
  recordFilterGroups,
  fieldMetadataItems,
}: {
  recordFilters: RecordFilter[];
  recordFilterGroups: RecordFilterGroup[];
  fieldMetadataItems: FieldMetadataItem[];
}): {
  recordFilters: RelationRollupFilterSnapshot[];
  recordFilterGroups: RelationRollupFilterGroupSnapshot[];
} => {
  const fieldMetadataItemById = Object.fromEntries(
    fieldMetadataItems.map((fieldMetadataItem) => [
      fieldMetadataItem.id,
      fieldMetadataItem,
    ]),
  );

  const mappedRecordFilters: RelationRollupFilterSnapshot[] = recordFilters
    .map((recordFilter) => {
      const fieldMetadataItem =
        fieldMetadataItemById[recordFilter.fieldMetadataId];

      if (
        !isDefined(fieldMetadataItem) ||
        !isDefined(fieldMetadataItem.universalIdentifier)
      ) {
        return null;
      }

      const relationTargetFieldMetadataItem = isDefined(
        recordFilter.relationTargetFieldMetadataId,
      )
        ? fieldMetadataItemById[recordFilter.relationTargetFieldMetadataId]
        : undefined;

      return {
        fieldMetadataUniversalIdentifier:
          fieldMetadataItem.universalIdentifier,
        relationTargetFieldMetadataUniversalIdentifier:
          relationTargetFieldMetadataItem?.universalIdentifier ?? null,
        operand: recordFilter.operand,
        value: recordFilter.value,
        viewFilterGroupId: recordFilter.recordFilterGroupId ?? null,
      } satisfies RelationRollupFilterSnapshot;
    })
    .filter(isDefined);

  const mappedRecordFilterGroups: RelationRollupFilterGroupSnapshot[] =
    recordFilterGroups.map((recordFilterGroup) => ({
      id: recordFilterGroup.id,
      parentViewFilterGroupId:
        recordFilterGroup.parentRecordFilterGroupId ?? null,
      logicalOperator:
        mapRecordFilterGroupLogicalOperatorToViewFilterGroupLogicalOperator({
          recordFilterGroupLogicalOperator: recordFilterGroup.logicalOperator,
        }),
    }));

  return {
    recordFilters: mappedRecordFilters,
    recordFilterGroups: mappedRecordFilterGroups,
  };
};
