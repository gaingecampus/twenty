import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRelationJoinColumnName } from '@/object-record/record-field/ui/utils/junction/getRelationJoinColumnName';
import { type UrlRecursiveFilterGroup } from '@/views/types/UrlRecursiveFilterGroup';
import { type UrlSingleFilter } from '@/views/types/UrlSingleFilter';
import { addDays, format } from 'date-fns';
import qs from 'qs';
import {
  AppPath,
  RecordFilterGroupLogicalOperator,
  ViewFilterOperand,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

// Convert the same filter used by the KPI into editable list filters.
export const buildStatusBoardListUrl = ({
  objectMetadataItem,
  filter,
  viewId,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  filter?: RecordGqlOperationFilter;
  viewId?: string;
}) => {
  const convert = (
    node: RecordGqlOperationFilter,
    negated = false,
  ): UrlRecursiveFilterGroup => {
    const group: UrlRecursiveFilterGroup = {
      operator: RecordFilterGroupLogicalOperator.AND,
      filters: [],
      groups: [],
    };
    for (const [key, condition] of Object.entries(node)) {
      if (key === 'and' || key === 'or') {
        const child: UrlRecursiveFilterGroup = {
          operator:
            key === 'and'
              ? RecordFilterGroupLogicalOperator.AND
              : RecordFilterGroupLogicalOperator.OR,
          filters: [],
          groups: [],
        };
        for (const entry of condition as RecordGqlOperationFilter[]) {
          const converted = convert(entry);
          if (
            converted.operator === child.operator ||
            (!converted.groups?.length && converted.filters?.length === 1)
          ) {
            child.filters!.push(...(converted.filters ?? []));
            child.groups!.push(...(converted.groups ?? []));
          } else child.groups!.push(converted);
        }
        if (child.operator === group.operator) {
          group.filters!.push(...(child.filters ?? []));
          group.groups!.push(...(child.groups ?? []));
        } else group.groups!.push(child);
        continue;
      }
      if (key === 'not') {
        const child = convert(condition as RecordGqlOperationFilter, true);
        group.filters!.push(...(child.filters ?? []));
        continue;
      }
      const field = objectMetadataItem.fields.find(
        (item) => item.name === key || getRelationJoinColumnName(item) === key,
      );
      if (!field) throw new Error(`Unknown status board filter field: ${key}`);
      for (const [operator, rawValue] of Object.entries(
        condition as Record<string, unknown>,
      )) {
        let op: ViewFilterOperand;
        let value = String(rawValue);
        if (operator === 'ilike') {
          op = ViewFilterOperand.CONTAINS;
          value = String(rawValue).slice(1, -1);
        } else if (operator === 'is' && rawValue === 'NULL') {
          op = ViewFilterOperand.IS_EMPTY;
          value = '';
        } else if (
          operator === 'eq' ||
          operator === 'neq' ||
          operator === 'in'
        ) {
          op =
            negated || operator === 'neq'
              ? ViewFilterOperand.IS_NOT
              : ViewFilterOperand.IS;
          const values = Array.isArray(rawValue) ? rawValue : [rawValue];
          value =
            field.type === 'RELATION'
              ? JSON.stringify({
                  isCurrentWorkspaceMemberSelected: false,
                  selectedRecordIds: values,
                })
              : JSON.stringify(values);
        } else if (
          operator === 'lt' ||
          operator === 'gte' ||
          operator === 'lte'
        ) {
          op =
            operator === 'gte'
              ? ViewFilterOperand.IS_AFTER
              : ViewFilterOperand.IS_BEFORE;
          // List date filters use an exclusive upper bound.
          if (operator === 'lte')
            value =
              field.type === 'DATE'
                ? format(
                    addDays(new Date(`${value}T12:00:00`), 1),
                    'yyyy-MM-dd',
                  )
                : new Date(new Date(value).getTime() + 1).toISOString();
        } else
          throw new Error(
            `Unsupported status board filter operator: ${operator}`,
          );
        group.filters!.push({
          field: field.name,
          op,
          value,
        } satisfies UrlSingleFilter);
      }
    }
    return group;
  };
  return `${getAppPath(AppPath.RecordIndexPage, { objectNamePlural: objectMetadataItem.namePlural })}?${qs.stringify({ viewId, ...(filter ? { filterGroup: convert(filter) } : {}) })}`;
};
