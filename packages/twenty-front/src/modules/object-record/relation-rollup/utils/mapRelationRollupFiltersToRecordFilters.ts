import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { type RecordFilterGroup } from '@/object-record/record-filter-group/types/RecordFilterGroup';
import { mapViewFilterGroupLogicalOperatorToRecordFilterGroupLogicalOperator } from '@/views/utils/mapViewFilterGroupLogicalOperatorToRecordFilterGroupLogicalOperator';
import {
  type RelationRollupFilterGroupSnapshot,
  type RelationRollupFilterSnapshot,
  type RelationRollupSettings,
} from 'twenty-shared/types';
import {
  convertViewFilterValueToString,
  getFilterTypeFromFieldType,
  isDefined,
} from 'twenty-shared/utils';

export const mapRelationRollupFiltersToRecordFilters = ({
  relationRollup,
  fieldMetadataItems,
}: {
  relationRollup: RelationRollupSettings;
  fieldMetadataItems: FieldMetadataItem[];
}): {
  recordFilters: RecordFilter[];
  recordFilterGroups: RecordFilterGroup[];
} => {
  const recordFilters = relationRollup.recordFilters ?? [];
  const recordFilterGroups = relationRollup.recordFilterGroups ?? [];

  const fieldMetadataItemByUniversalIdentifier = Object.fromEntries(
    fieldMetadataItems
      .filter((fieldMetadataItem) =>
        isDefined(fieldMetadataItem.universalIdentifier),
      )
      .map((fieldMetadataItem) => [
        fieldMetadataItem.universalIdentifier,
        fieldMetadataItem,
      ]),
  );

  const mappedRecordFilters: RecordFilter[] = recordFilters
    .map((filterSnapshot: RelationRollupFilterSnapshot) => {
      const fieldMetadataItem =
        fieldMetadataItemByUniversalIdentifier[
          filterSnapshot.fieldMetadataUniversalIdentifier
        ];

      if (!isDefined(fieldMetadataItem)) {
        return null;
      }

      const relationTargetFieldMetadataItem = isDefined(
        filterSnapshot.relationTargetFieldMetadataUniversalIdentifier,
      )
        ? fieldMetadataItemByUniversalIdentifier[
            filterSnapshot.relationTargetFieldMetadataUniversalIdentifier
          ]
        : undefined;

      const filterType = isDefined(relationTargetFieldMetadataItem)
        ? getFilterTypeFromFieldType(relationTargetFieldMetadataItem.type)
        : getFilterTypeFromFieldType(fieldMetadataItem.type);

      const label = isDefined(relationTargetFieldMetadataItem)
        ? `${fieldMetadataItem.label} → ${relationTargetFieldMetadataItem.label}`
        : fieldMetadataItem.label;

      return {
        id: filterSnapshot.fieldMetadataUniversalIdentifier,
        fieldMetadataId: fieldMetadataItem.id,
        operand: filterSnapshot.operand,
        value: convertViewFilterValueToString(filterSnapshot.value),
        displayValue: convertViewFilterValueToString(filterSnapshot.value),
        type: filterType,
        label,
        recordFilterGroupId: filterSnapshot.viewFilterGroupId ?? undefined,
        relationTargetFieldMetadataId:
          relationTargetFieldMetadataItem?.id ?? undefined,
      } satisfies RecordFilter;
    })
    .filter(isDefined);

  const mappedRecordFilterGroups: RecordFilterGroup[] = recordFilterGroups.map(
    (filterGroupSnapshot: RelationRollupFilterGroupSnapshot) => ({
      id: filterGroupSnapshot.id,
      parentRecordFilterGroupId:
        filterGroupSnapshot.parentViewFilterGroupId ?? undefined,
      logicalOperator:
        mapViewFilterGroupLogicalOperatorToRecordFilterGroupLogicalOperator({
          viewFilterGroupLogicalOperator: filterGroupSnapshot.logicalOperator,
        }),
    }),
  );

  return {
    recordFilters: mappedRecordFilters,
    recordFilterGroups: mappedRecordFilterGroups,
  };
};
