import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const buildStatusBoardSharedMemberFilter = ({
  memberIds,
  directFilter,
  sharedRecordIds,
}: {
  memberIds: string[] | undefined;
  directFilter: RecordGqlOperationFilter | undefined;
  sharedRecordIds: string[];
}): RecordGqlOperationFilter | undefined => {
  if (memberIds === undefined) return undefined;
  if (memberIds.length === 0) return { id: { is: 'NULL' } };
  const filters = [
    ...(directFilter ? [directFilter] : []),
    ...(sharedRecordIds.length
      ? [{ id: { in: [...new Set(sharedRecordIds)] } }]
      : []),
  ];
  return filters.length ? { or: filters } : { id: { is: 'NULL' } };
};
