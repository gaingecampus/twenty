import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { mapRelationRollupFiltersToRecordFilters } from '@/object-record/relation-rollup/utils/mapRelationRollupFiltersToRecordFilters';
import {
  type RelationRollupSettings,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { computeRecordGqlOperationFilter } from 'twenty-shared/utils';

export const convertRelationRollupFiltersToGqlFilter = ({
  relationRollup,
  fieldMetadataItems,
}: {
  relationRollup: RelationRollupSettings;
  fieldMetadataItems: FieldMetadataItem[];
}): RecordGqlOperationFilter | undefined => {
  const { recordFilters, recordFilterGroups } =
    mapRelationRollupFiltersToRecordFilters({
      relationRollup,
      fieldMetadataItems,
    });

  if (recordFilters.length === 0) {
    return undefined;
  }

  return computeRecordGqlOperationFilter({
    fieldMetadataItems,
    recordFilters,
    recordFilterGroups,
    filterValueDependencies: {},
  });
};
