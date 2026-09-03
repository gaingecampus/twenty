import { RECORD_TABLE_COLUMN_ADD_COLUMN_BUTTON_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnAddColumnButtonWidth';
import { RECORD_TABLE_COLUMN_CHECKBOX_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnCheckboxWidth';
import { RECORD_TABLE_COLUMN_DRAG_AND_DROP_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnDragAndDropWidth';
import { RECORD_TABLE_COLUMN_LAST_EMPTY_COLUMN_WIDTH_VARIABLE_NAME } from '@/object-record/record-table/constants/RecordTableColumnLastEmptyColumnWidthVariableName';
import { RECORD_TABLE_COLUMN_MIN_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnMinWidth';
import { RECORD_TABLE_COLUMN_WITH_GROUP_LAST_EMPTY_COLUMN_WIDTH_VARIABLE_NAME } from '@/object-record/record-table/constants/RecordTableColumnWithGroupLastEmptyColumnWidthVariableName';
import { getRecordTableColumnDisplayWidth } from '@/object-record/record-table/constants/RecordTableColumnWidthExtra';
import { RECORD_TABLE_LABEL_IDENTIFIER_COLUMN_WIDTH_ON_MOBILE } from '@/object-record/record-table/constants/RecordTableLabelIdentifierColumnWidthOnMobile';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useIsRecordTableAddColumnButtonHidden } from '@/object-record/record-table/hooks/useIsRecordTableAddColumnButtonHidden';
import { useIsRecordTableCheckboxColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableCheckboxColumnHidden';
import { useIsRecordTableDragColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableDragColumnHidden';
import { recordTableWidthComponentState } from '@/object-record/record-table/states/recordTableWidthComponentState';
import { resizedFieldMetadataIdComponentState } from '@/object-record/record-table/states/resizedFieldMetadataIdComponentState';
import { shouldCompactRecordTableFirstColumnComponentState } from '@/object-record/record-table/states/shouldCompactRecordTableFirstColumnComponentState';
import { computeLastRecordTableColumnWidth } from '@/object-record/record-table/utils/computeLastRecordTableColumnWidth';
import { computeVisibleRecordFieldsWidthOnTable } from '@/object-record/record-table/utils/computeVisibleRecordFieldsWidthOnTable';
import { getRecordTableColumnFieldWidthCSSVariableName } from '@/object-record/record-table/utils/getRecordTableColumnFieldWidthCSSVariableName';
import { updateRecordTableCSSVariable } from '@/object-record/record-table/utils/updateRecordTableCSSVariable';
import { RECORD_TABLE_VIRTUALIZATION_BODY_PLACEHOLDER_WIDTH_CSS_VARIABLE_NAME } from '@/object-record/record-table/virtualization/components/RecordTableVirtualizedBodyPlaceholder';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';

import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

export const RecordTableColumnWidthEffect = () => {
  const [resizedFieldMetadataId] = useAtomComponentState(
    resizedFieldMetadataIdComponentState,
  );

  const { visibleRecordFields, recordTableId } = useRecordTableContextOrThrow();

  const shouldCompactRecordTableFirstColumn = useAtomComponentStateValue(
    shouldCompactRecordTableFirstColumnComponentState,
  );

  const recordTableWidth = useAtomComponentStateValue(
    recordTableWidthComponentState,
  );

  const isRecordTableDragColumnHidden = useIsRecordTableDragColumnHidden();

  const isRecordTableCheckboxColumnHidden =
    useIsRecordTableCheckboxColumnHidden();

  const isRecordTableAddColumnButtonHidden =
    useIsRecordTableAddColumnButtonHidden();

  useEffect(() => {
    if (isDefined(resizedFieldMetadataId)) {
      return;
    }

    const { lastColumnWidth } = computeLastRecordTableColumnWidth({
      recordFields: visibleRecordFields,
      shouldCompactFirstColumn: shouldCompactRecordTableFirstColumn,
      tableWidth: recordTableWidth,
      isDragColumnHidden: isRecordTableDragColumnHidden,
      isCheckboxColumnHidden: isRecordTableCheckboxColumnHidden,
      isAddColumnButtonHidden: isRecordTableAddColumnButtonHidden,
    });

    const { visibleRecordFieldsWidth } = computeVisibleRecordFieldsWidthOnTable(
      {
        shouldCompactFirstColumn: shouldCompactRecordTableFirstColumn,
        visibleRecordFields,
      },
    );

    const dragColumnWidth = isRecordTableDragColumnHidden
      ? 0
      : RECORD_TABLE_COLUMN_DRAG_AND_DROP_WIDTH;

    const checkboxColumnWidth = isRecordTableCheckboxColumnHidden
      ? 0
      : RECORD_TABLE_COLUMN_CHECKBOX_WIDTH;

    const addColumnButtonWidth = isRecordTableAddColumnButtonHidden
      ? 0
      : RECORD_TABLE_COLUMN_ADD_COLUMN_BUTTON_WIDTH;

    const leftColumnsWidth = dragColumnWidth + checkboxColumnWidth;

    const totalTableBodyWidth =
      visibleRecordFieldsWidth +
      leftColumnsWidth +
      addColumnButtonWidth +
      lastColumnWidth;

    updateRecordTableCSSVariable(
      recordTableId,
      RECORD_TABLE_VIRTUALIZATION_BODY_PLACEHOLDER_WIDTH_CSS_VARIABLE_NAME,
      `${totalTableBodyWidth}px`,
    );

    updateRecordTableCSSVariable(
      recordTableId,
      RECORD_TABLE_COLUMN_LAST_EMPTY_COLUMN_WIDTH_VARIABLE_NAME,
      `${lastColumnWidth}px`,
    );

    updateRecordTableCSSVariable(
      recordTableId,
      RECORD_TABLE_COLUMN_WITH_GROUP_LAST_EMPTY_COLUMN_WIDTH_VARIABLE_NAME,
      `${lastColumnWidth}px`,
    );

    for (const [index, recordField] of visibleRecordFields.entries()) {
      updateRecordTableCSSVariable(
        recordTableId,
        getRecordTableColumnFieldWidthCSSVariableName(index),
        `${getRecordTableColumnDisplayWidth(recordField.size)}px`,
      );
    }

    if (shouldCompactRecordTableFirstColumn) {
      updateRecordTableCSSVariable(
        recordTableId,
        getRecordTableColumnFieldWidthCSSVariableName(0),
        `${getRecordTableColumnDisplayWidth(RECORD_TABLE_LABEL_IDENTIFIER_COLUMN_WIDTH_ON_MOBILE)}px`,
      );
    } else {
      const firstColumnWidth =
        visibleRecordFields[0]?.size ?? RECORD_TABLE_COLUMN_MIN_WIDTH;

      updateRecordTableCSSVariable(
        recordTableId,
        getRecordTableColumnFieldWidthCSSVariableName(0),
        `${getRecordTableColumnDisplayWidth(firstColumnWidth)}px`,
      );
    }
  }, [
    resizedFieldMetadataId,
    visibleRecordFields,
    recordTableWidth,
    shouldCompactRecordTableFirstColumn,
    isRecordTableDragColumnHidden,
    isRecordTableCheckboxColumnHidden,
    isRecordTableAddColumnButtonHidden,
    recordTableId,
  ]);

  return null;
};
