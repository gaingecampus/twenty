import { RECORD_TABLE_CELL_HORIZONTAL_PADDING } from '@/object-record/record-table/constants/RecordTableCellHorizontalPadding';
import { getRecordTableColumnDisplayWidth } from '@/object-record/record-table/utils/getRecordTableColumnDisplayWidth';
export const getRecordTableChipMaxWidth = (size: number) =>
  getRecordTableColumnDisplayWidth(size) - RECORD_TABLE_CELL_HORIZONTAL_PADDING;
