import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { isDefined } from 'twenty-shared/utils';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';

export const getStatusBoardRecordInitial = (record: ObjectRecord): string => {
  const label = getStatusBoardRecordLabel(record).replace(
    /^\(주\)|\(주\)$/g,
    '',
  );
  const trimmedLabel = label.trim();

  if (trimmedLabel.length === 0) {
    return '?';
  }

  return trimmedLabel.slice(0, 1).toUpperCase();
};

export const getStatusBoardRecordCaption = (
  record: ObjectRecord,
): string | undefined => {
  if (
    typeof record.company === 'object' &&
    isDefined(record.company) &&
    'name' in record.company &&
    typeof record.company.name === 'string' &&
    record.company.name.length > 0 &&
    record.company.name !== getStatusBoardRecordLabel(record)
  ) {
    return record.company.name;
  }

  return undefined;
};
