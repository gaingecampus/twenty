import { RecordTableDraggableTr } from '@/object-record/record-table/record-table-row/components/RecordTableDraggableTr';
import { RecordTableRowCells } from '@/object-record/record-table/record-table-row/components/RecordTableRowCells';
import { RecordTableStaticTr } from '@/object-record/record-table/record-table-row/components/RecordTableStaticTr';
import { useIsRecordTableDragColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableDragColumnHidden';

type RecordTableRowProps = {
  recordId: string;
  rowIndexForFocus: number;
  rowIndexForDrag: number;
};

export const RecordTableRow = ({
  recordId,
  rowIndexForFocus,
  rowIndexForDrag,
}: RecordTableRowProps) => {
  const isRecordTableDragColumnHidden = useIsRecordTableDragColumnHidden();

  if (isRecordTableDragColumnHidden) {
    return (
      <RecordTableStaticTr recordId={recordId} focusIndex={rowIndexForFocus}>
        <RecordTableRowCells rowIndexForFocus={rowIndexForFocus} />
      </RecordTableStaticTr>
    );
  }

  return (
    <RecordTableDraggableTr
      recordId={recordId}
      draggableIndex={rowIndexForDrag}
      focusIndex={rowIndexForFocus}
    >
      <RecordTableRowCells rowIndexForFocus={rowIndexForFocus} />
    </RecordTableDraggableTr>
  );
};
