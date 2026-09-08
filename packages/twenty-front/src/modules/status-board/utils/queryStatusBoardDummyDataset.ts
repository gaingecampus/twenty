import { type StatusBoardDummyDataset } from '@/status-board/utils/buildStatusBoardDummyDataset';
import { matchesStatusBoardDummyFilter } from '@/status-board/utils/matchesStatusBoardDummyFilter';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import {
  type RecordGqlOperationVariables,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

export const queryStatusBoardDummyRecords = ({
  dataset,
  objectNameSingular,
  filter,
  limit,
  orderBy,
}: {
  dataset: StatusBoardDummyDataset;
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  limit: number;
  orderBy?: RecordGqlOperationVariables['orderBy'];
}): ObjectRecord[] => {
  const records = dataset[objectNameSingular] ?? [];

  return records
    .filter((record) =>
      matchesStatusBoardDummyFilter({
        record,
        filter,
      }),
    )
    .sort((left, right) => {
      for (const sort of orderBy ?? []) {
        for (const [field, direction] of Object.entries(sort)) {
          const a = left[field];
          const b = right[field];
          if (a === b) continue;
          if (a == null) return 1;
          if (b == null) return -1;
          const comparison = String(a).localeCompare(String(b), 'ko');
          if (comparison)
            return String(direction).startsWith('Desc')
              ? -comparison
              : comparison;
        }
      }
      return 0;
    })
    .slice(0, limit);
};

export const countStatusBoardDummyRecords = ({
  dataset,
  objectNameSingular,
  filter,
}: {
  dataset: StatusBoardDummyDataset;
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
}): number => {
  const records = dataset[objectNameSingular] ?? [];

  return records.filter((record) =>
    matchesStatusBoardDummyFilter({
      record,
      filter,
    }),
  ).length;
};

export const sumStatusBoardDummyAmount = ({
  dataset,
  objectNameSingular,
  filter,
}: {
  dataset: StatusBoardDummyDataset;
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
}): number | undefined => {
  const records = dataset[objectNameSingular] ?? [];
  const matchedRecords = records.filter((record) =>
    matchesStatusBoardDummyFilter({
      record,
      filter,
    }),
  );

  if (matchedRecords.length === 0) {
    return undefined;
  }

  return matchedRecords.reduce((total, record) => {
    return total + (typeof record.amount === 'number' ? record.amount : 0);
  }, 0);
};
