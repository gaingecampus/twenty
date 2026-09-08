import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const getComparableValues = (
  value: unknown,
): Array<string | number | boolean> => {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => getComparableValues(item));
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    const identifier = value.id;

    if (typeof identifier === 'string' || typeof identifier === 'number') {
      return [identifier];
    }
  }

  return [];
};

const getRecordFieldValue = (
  record: ObjectRecord,
  fieldName: string,
): unknown => {
  const fieldValue = record[fieldName];

  if (isDefined(fieldValue)) {
    return fieldValue;
  }

  if (fieldName.endsWith('Id')) {
    const relationFieldName = fieldName.slice(0, -2);

    return record[relationFieldName];
  }

  return undefined;
};

const matchesLeafOperand = ({
  record,
  fieldName,
  operand,
}: {
  record: ObjectRecord;
  fieldName: string;
  operand: Record<string, unknown>;
}): boolean => {
  const fieldValue = getRecordFieldValue(record, fieldName);
  const comparableValues = getComparableValues(fieldValue);

  if (operand.is === 'NULL') {
    return !isDefined(fieldValue);
  }

  if (operand.is === 'NOT_NULL') {
    return isDefined(fieldValue);
  }

  if (operand.eq !== undefined) {
    return comparableValues.includes(operand.eq as string | number | boolean);
  }

  if (operand.neq !== undefined) {
    return !comparableValues.includes(operand.neq as string | number | boolean);
  }

  if (Array.isArray(operand.in)) {
    return operand.in.some((item) =>
      comparableValues.includes(item as string | number | boolean),
    );
  }

  const stringValue =
    comparableValues.length === 1 ? String(comparableValues[0]) : undefined;

  if (typeof operand.gte === 'string' && stringValue !== undefined) {
    return stringValue >= operand.gte;
  }

  if (typeof operand.lte === 'string' && stringValue !== undefined) {
    return stringValue <= operand.lte;
  }

  if (typeof operand.lt === 'string' && stringValue !== undefined) {
    return stringValue < operand.lt;
  }

  if (typeof operand.gt === 'string' && stringValue !== undefined) {
    return stringValue > operand.gt;
  }

  return true;
};

export const matchesStatusBoardDummyFilter = ({
  record,
  filter,
}: {
  record: ObjectRecord;
  filter?: RecordGqlOperationFilter;
}): boolean => {
  if (!isDefined(filter)) {
    return true;
  }

  if ('and' in filter && Array.isArray(filter.and)) {
    return filter.and.every((nestedFilter) =>
      matchesStatusBoardDummyFilter({
        record,
        filter: nestedFilter as RecordGqlOperationFilter,
      }),
    );
  }

  if ('or' in filter && isDefined(filter.or)) {
    const orFilters = Array.isArray(filter.or) ? filter.or : [filter.or];

    return orFilters.some((nestedFilter) =>
      matchesStatusBoardDummyFilter({
        record,
        filter: nestedFilter as RecordGqlOperationFilter,
      }),
    );
  }

  if ('not' in filter && isDefined(filter.not)) {
    return !matchesStatusBoardDummyFilter({
      record,
      filter: filter.not as RecordGqlOperationFilter,
    });
  }

  return Object.entries(filter).every(([fieldName, operand]) => {
    if (!isDefined(operand) || typeof operand !== 'object') {
      return true;
    }

    return matchesLeafOperand({
      record,
      fieldName,
      operand: operand as Record<string, unknown>,
    });
  });
};
