import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { RECORD_TABLE_COLUMN_ADD_COLUMN_BUTTON_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnAddColumnButtonWidth';
import { RECORD_TABLE_COLUMN_CHECKBOX_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnCheckboxWidth';
import { RECORD_TABLE_COLUMN_DRAG_AND_DROP_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnDragAndDropWidth';
import { computeVisibleRecordFieldsWidthOnTable } from '@/object-record/record-table/utils/computeVisibleRecordFieldsWidthOnTable';

export const computeLastRecordTableColumnWidth = ({
  recordFields,
  tableWidth,
  shouldCompactFirstColumn,
  isDragColumnHidden,
  isCheckboxColumnHidden,
  isAddColumnButtonHidden,
}: {
  recordFields: Pick<RecordField, 'size'>[];
  tableWidth: number;
  shouldCompactFirstColumn: boolean;
  isDragColumnHidden?: boolean;
  isCheckboxColumnHidden?: boolean;
  isAddColumnButtonHidden?: boolean;
}) => {
  const { visibleRecordFieldsWidth } = computeVisibleRecordFieldsWidthOnTable({
    shouldCompactFirstColumn,
    visibleRecordFields: recordFields,
  });

  const widthOfBorders = recordFields.length + 1;

  const dragColumnWidth = isDragColumnHidden
    ? 0
    : RECORD_TABLE_COLUMN_DRAG_AND_DROP_WIDTH;

  const checkboxColumnWidth = isCheckboxColumnHidden
    ? 0
    : RECORD_TABLE_COLUMN_CHECKBOX_WIDTH;

  const leftColumnsWidth = dragColumnWidth + checkboxColumnWidth;

  const addColumnButtonWidth = isAddColumnButtonHidden
    ? 0
    : RECORD_TABLE_COLUMN_ADD_COLUMN_BUTTON_WIDTH;

  const fixedColumnsWidth =
    leftColumnsWidth + addColumnButtonWidth + widthOfBorders;

  const remainingWidthToFill = Math.max(
    0,
    tableWidth - fixedColumnsWidth - visibleRecordFieldsWidth,
  );

  const lastColumnWidth = remainingWidthToFill;

  return {
    lastColumnWidth,
  };
};
