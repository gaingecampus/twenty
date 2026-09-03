import {
  RECORD_INDEX_PAGE_SIZE_OPTIONS,
  type RecordIndexPageSize,
} from '@/object-record/record-index/constants/RecordIndexPageSizeOptions';

export const isRecordIndexPageSize = (
  value: unknown,
): value is RecordIndexPageSize => {
  return RECORD_INDEX_PAGE_SIZE_OPTIONS.some((pageSize) => pageSize === value);
};
