import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useIsRecordTableAddColumnButtonHidden } from '@/object-record/record-table/hooks/useIsRecordTableAddColumnButtonHidden';
import { useIsRecordTableCheckboxColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableCheckboxColumnHidden';
import { useIsRecordTableDragColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableDragColumnHidden';
import { recordTableWidthComponentState } from '@/object-record/record-table/states/recordTableWidthComponentState';
import { shouldCompactRecordTableFirstColumnComponentState } from '@/object-record/record-table/states/shouldCompactRecordTableFirstColumnComponentState';
import { computeLastRecordTableColumnWidth } from '@/object-record/record-table/utils/computeLastRecordTableColumnWidth';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';

export const useRecordTableLastColumnWidthToFill = () => {
  const { visibleRecordFields } = useRecordTableContextOrThrow();

  const recordTableWidth = useAtomComponentStateValue(
    recordTableWidthComponentState,
  );

  const shouldCompactRecordTableFirstColumn = useAtomComponentStateValue(
    shouldCompactRecordTableFirstColumnComponentState,
  );

  const isRecordTableDragColumnHidden = useIsRecordTableDragColumnHidden();

  const isRecordTableCheckboxColumnHidden =
    useIsRecordTableCheckboxColumnHidden();

  const isRecordTableAddColumnButtonHidden =
    useIsRecordTableAddColumnButtonHidden();

  const { lastColumnWidth } = computeLastRecordTableColumnWidth({
    recordFields: visibleRecordFields,
    tableWidth: recordTableWidth,
    shouldCompactFirstColumn: shouldCompactRecordTableFirstColumn,
    isDragColumnHidden: isRecordTableDragColumnHidden,
    isCheckboxColumnHidden: isRecordTableCheckboxColumnHidden,
    isAddColumnButtonHidden: isRecordTableAddColumnButtonHidden,
  });

  return {
    lastColumnWidth,
  };
};
