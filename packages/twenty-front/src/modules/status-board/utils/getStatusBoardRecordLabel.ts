import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { isDefined } from 'twenty-shared/utils';

export const getStatusBoardRecordLabel = (record: ObjectRecord): string => {
  if (typeof record.name === 'string' && record.name.length > 0) {
    return record.name;
  }

  if (
    typeof record.name === 'object' &&
    isDefined(record.name) &&
    'firstName' in record.name
  ) {
    const firstName =
      typeof record.name.firstName === 'string' ? record.name.firstName : '';
    const lastName =
      typeof record.name.lastName === 'string' ? record.name.lastName : '';

    return `${firstName} ${lastName}`.trim();
  }

  if (
    typeof record.company === 'object' &&
    isDefined(record.company) &&
    'name' in record.company &&
    typeof record.company.name === 'string'
  ) {
    return record.company.name;
  }

  return record.id;
};
