import { COMPOSITE_FIELD_TYPE_SUB_FIELDS_NAMES } from 'twenty-shared/constants';
import {
  type ChartFilter,
  RecordFilterGroupLogicalOperator,
  ViewFilterOperand,
} from 'twenty-shared/types';
import {
  type FieldShared,
  getFilterTypeFromFieldType,
  isDefined,
} from 'twenty-shared/utils';

// Persisted chart filters omit UI labels and may omit values for emptiness operands.
export const normalizeChartFiltersForQuery = (
  filters: ChartFilter,
  fields: FieldShared[],
) => ({
  recordFilters: (filters.recordFilters ?? []).map((filter) => {
    const operand = Object.values(ViewFilterOperand).find(
      (value) => value === filter.operand,
    );
    const field = fields.find(
      (item) =>
        item.id ===
        (filter.relationTargetFieldMetadataId ?? filter.fieldMetadataId),
    );
    if (!isDefined(operand) || !isDefined(field)) {
      throw new Error('Invalid chart filter');
    }
    const subFieldName = Object.values(COMPOSITE_FIELD_TYPE_SUB_FIELDS_NAMES)
      .flatMap((names) => Object.values(names))
      .find((name) => name === filter.subFieldName);
    if (isDefined(filter.subFieldName) && !isDefined(subFieldName)) {
      throw new Error('Invalid chart filter subfield');
    }
    return {
      ...filter,
      operand,
      type: getFilterTypeFromFieldType(field.type),
      value: filter.value ?? '',
      subFieldName,
    };
  }),
  recordFilterGroups: (filters.recordFilterGroups ?? []).map((group) => {
    const logicalOperator = Object.values(
      RecordFilterGroupLogicalOperator,
    ).find((value) => value === group.logicalOperator);
    if (!isDefined(logicalOperator)) {
      throw new Error('Invalid chart filter group operator');
    }
    return { ...group, logicalOperator };
  }),
});
