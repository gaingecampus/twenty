import { type StatusBoardDummyDataset } from '@/status-board/utils/buildStatusBoardDummyDataset';
import { matchesStatusBoardDummyFilter } from '@/status-board/utils/matchesStatusBoardDummyFilter';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const queryStatusBoardDummyRecords = ({
  dataset,
  objectNameSingular,
  filter,
  limit,
}: {
  dataset: StatusBoardDummyDataset;
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  limit: number;
}): ObjectRecord[] => {
  const records = dataset[objectNameSingular] ?? [];

  return records
    .filter((record) =>
      matchesStatusBoardDummyFilter({
        record,
        filter,
      }),
    )
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
