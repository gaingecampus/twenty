import { RECORD_TABLE_COLUMN_WIDTH_EXTRA } from '@/object-record/record-table/constants/RecordTableColumnWidthExtra';
export const getRecordTableColumnDisplayWidth = (size: number) =>
  size + RECORD_TABLE_COLUMN_WIDTH_EXTRA;
