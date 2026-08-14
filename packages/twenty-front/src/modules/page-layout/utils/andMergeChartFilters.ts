import {
  RecordFilterGroupLogicalOperator,
  type ChartFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

const isEmptyChartFilter = (chartFilter?: ChartFilter | null): boolean => {
  const hasRecordFilters =
    isDefined(chartFilter?.recordFilters) &&
    chartFilter.recordFilters.length > 0;
  const hasRecordFilterGroups =
    isDefined(chartFilter?.recordFilterGroups) &&
    chartFilter.recordFilterGroups.length > 0;

  return !hasRecordFilters && !hasRecordFilterGroups;
};

const remapParentGroupId = ({
  parentRecordFilterGroupId,
  mergeRootGroupId,
  groupIdMap,
}: {
  parentRecordFilterGroupId?: string | null;
  mergeRootGroupId: string;
  groupIdMap?: Map<string, string>;
}): string => {
  if (!isDefined(parentRecordFilterGroupId)) {
    return mergeRootGroupId;
  }

  if (!isDefined(groupIdMap)) {
    return parentRecordFilterGroupId;
  }

  return groupIdMap.get(parentRecordFilterGroupId) ?? mergeRootGroupId;
};

export const andMergeChartFilters = ({
  left,
  right,
}: {
  left?: ChartFilter | null;
  right?: ChartFilter | null;
}): ChartFilter => {
  if (isEmptyChartFilter(left)) {
    return right ?? {};
  }

  if (isEmptyChartFilter(right)) {
    return left ?? {};
  }

  const mergeRootGroupId = v4();
  const rightGroupIdMap = new Map<string, string>();

  for (const recordFilterGroup of right?.recordFilterGroups ?? []) {
    rightGroupIdMap.set(recordFilterGroup.id, v4());
  }

  return {
    recordFilterGroups: [
      {
        id: mergeRootGroupId,
        logicalOperator: RecordFilterGroupLogicalOperator.AND,
        parentRecordFilterGroupId: null,
      },
      ...(left?.recordFilterGroups ?? []).map((recordFilterGroup) => ({
        ...recordFilterGroup,
        parentRecordFilterGroupId: remapParentGroupId({
          parentRecordFilterGroupId:
            recordFilterGroup.parentRecordFilterGroupId,
          mergeRootGroupId,
        }),
      })),
      ...(right?.recordFilterGroups ?? []).map((recordFilterGroup) => ({
        ...recordFilterGroup,
        id: rightGroupIdMap.get(recordFilterGroup.id) ?? recordFilterGroup.id,
        parentRecordFilterGroupId: remapParentGroupId({
          parentRecordFilterGroupId:
            recordFilterGroup.parentRecordFilterGroupId,
          mergeRootGroupId,
          groupIdMap: rightGroupIdMap,
        }),
      })),
    ],
    recordFilters: [
      ...(left?.recordFilters ?? []).map((recordFilter) => ({
        ...recordFilter,
        recordFilterGroupId: remapParentGroupId({
          parentRecordFilterGroupId: recordFilter.recordFilterGroupId,
          mergeRootGroupId,
        }),
      })),
      ...(right?.recordFilters ?? []).map((recordFilter) => ({
        ...recordFilter,
        recordFilterGroupId: remapParentGroupId({
          parentRecordFilterGroupId: recordFilter.recordFilterGroupId,
          mergeRootGroupId,
          groupIdMap: rightGroupIdMap,
        }),
      })),
    ],
  };
};
