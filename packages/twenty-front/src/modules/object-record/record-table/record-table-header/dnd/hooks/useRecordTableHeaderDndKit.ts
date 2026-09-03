import { type DragDropProvider } from '@dnd-kit/react';
import { useStore } from 'jotai';
import { type ComponentProps, useCallback, useState } from 'react';
import { filterOutByProperty, isDefined } from 'twenty-shared/utils';

import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { RECORD_TABLE_COLUMN_CHECKBOX_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnCheckboxWidth';
import { RECORD_TABLE_COLUMN_DRAG_AND_DROP_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnDragAndDropWidth';
import { useReorderVisibleRecordFields } from '@/object-record/record-field/hooks/useReorderVisibleRecordFields';
import { resolveRecordTableHeaderDrop } from '@/object-record/record-table/record-table-header/dnd/utils/resolveRecordTableHeaderDrop';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useSaveCurrentViewFields } from '@/views/hooks/useSaveCurrentViewFields';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { mapRecordFieldToViewFieldFromCurrentView } from '@/views/utils/mapRecordFieldToViewFieldFromCurrentView';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { isRecordTableHeaderDropProcessingComponentState } from '@/object-record/record-table/record-table-header/states/isRecordTableHeaderDropProcessingComponentState';
import { useDragSelect } from '@/ui/utilities/drag-select/hooks/useDragSelect';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useScrollWrapperHTMLElement } from '@/ui/utilities/scroll/hooks/useScrollWrapperHTMLElement';
import { type RecordTableHeaderDndData } from '@/object-record/record-table/record-table-header/dnd/types/RecordTableHeaderDndData';
import { useIsRecordTableCheckboxColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableCheckboxColumnHidden';
import { useIsRecordTableDragColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableDragColumnHidden';

type DragStartPayload = Parameters<
  NonNullable<
    ComponentProps<
      typeof DragDropProvider<RecordTableHeaderDndData>
    >['onDragStart']
  >
>[0];
type DragMovePayload = Parameters<
  NonNullable<
    ComponentProps<
      typeof DragDropProvider<RecordTableHeaderDndData>
    >['onDragMove']
  >
>[0];
type DragEndPayload = Parameters<
  NonNullable<
    ComponentProps<
      typeof DragDropProvider<RecordTableHeaderDndData>
    >['onDragEnd']
  >
>[0];

export type RecordTableHeaderDndKitContextValues = {
  activeDropTargetIndex: number | null;
};

export const useRecordTableHeaderDndKit = (): {
  contextValues: RecordTableHeaderDndKitContextValues;
  handlers: {
    onDragStart: (event: DragStartPayload) => void;
    onDragMove: (event: DragMovePayload) => void;
    onDragEnd: (event: DragEndPayload) => void;
  };
} => {
  const store = useStore();

  const { recordTableId, visibleRecordFields } = useRecordTableContextOrThrow();
  const { labelIdentifierFieldMetadataItem } = useRecordIndexContextOrThrow();
  const { reorderVisibleRecordFields } =
    useReorderVisibleRecordFields(recordTableId);
  const { saveViewFields } = useSaveCurrentViewFields();
  const { getViewFromState } = useGetViewFromState();
  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );
  const { setDragSelectionStartEnabled } = useDragSelect();
  const { getScrollWrapperElement } = useScrollWrapperHTMLElement();

  const isRecordTableHeaderDropProcessingCallbackState =
    useAtomComponentStateCallbackState(
      isRecordTableHeaderDropProcessingComponentState,
    );
  const isRecordTableDragColumnHidden = useIsRecordTableDragColumnHidden();
  const isRecordTableCheckboxColumnHidden =
    useIsRecordTableCheckboxColumnHidden();

  const [activeDropTargetIndex, setActiveDropTargetIndex] = useState<
    number | null
  >(null);

  const recordFieldsWithoutLabelIdentifier = visibleRecordFields.filter(
    filterOutByProperty(
      'fieldMetadataItemId',
      labelIdentifierFieldMetadataItem?.id,
    ),
  );

  const labelIdentifierRecordField = visibleRecordFields.find(
    (recordField) =>
      recordField.fieldMetadataItemId === labelIdentifierFieldMetadataItem?.id,
  );

  const nonSortableColumnsWidth =
    (isRecordTableDragColumnHidden
      ? 0
      : RECORD_TABLE_COLUMN_DRAG_AND_DROP_WIDTH) +
    (isRecordTableCheckboxColumnHidden
      ? 0
      : RECORD_TABLE_COLUMN_CHECKBOX_WIDTH) +
    (labelIdentifierRecordField?.size ?? 0);

  const resolveDropFromPointerX = useCallback(
    ({ pointerX, sourceIndex }: { pointerX: number; sourceIndex: number }) => {
      const { scrollWrapperElement } = getScrollWrapperElement();
      if (!isDefined(scrollWrapperElement)) return null;

      return resolveRecordTableHeaderDrop({
        pointerX,
        sourceIndex,
        scrollWrapperElement,
        nonSortableColumnsWidth,
        recordFields: recordFieldsWithoutLabelIdentifier,
      });
    },
    [
      getScrollWrapperElement,
      nonSortableColumnsWidth,
      recordFieldsWithoutLabelIdentifier,
    ],
  );

  const handleDragStart = (_event: DragStartPayload) => {
    store.set(isRecordTableHeaderDropProcessingCallbackState, true);

    setActiveDropTargetIndex(null);
  };

  const handleDragMove = useCallback(
    (event: DragMovePayload) => {
      const { operation } = event;
      const sourceIndex = operation.source?.data.index;

      if (!isDefined(sourceIndex)) {
        setActiveDropTargetIndex(null);
        return;
      }

      const resolvedDrop = resolveDropFromPointerX({
        pointerX: operation.position.current.x,
        sourceIndex,
      });

      setActiveDropTargetIndex((currentActiveDropTargetIndex) => {
        const nextActiveDropTargetIndex = resolvedDrop?.dropTargetIndex ?? null;

        return currentActiveDropTargetIndex === nextActiveDropTargetIndex
          ? currentActiveDropTargetIndex
          : nextActiveDropTargetIndex;
      });
    },
    [resolveDropFromPointerX, setActiveDropTargetIndex],
  );

  const handleDragEnd = (event: DragEndPayload) => {
    const { operation } = event;
    const source = operation.source;

    setActiveDropTargetIndex(null);
    setDragSelectionStartEnabled(true);
    store.set(isRecordTableHeaderDropProcessingCallbackState, false);

    if (event.canceled) return;
    if (!isDefined(source)) return;

    const sourceIndex = source.data.index;
    const resolvedDrop = resolveDropFromPointerX({
      pointerX: operation.position.current.x,
      sourceIndex,
    });

    if (!isDefined(resolvedDrop)) return;
    if (resolvedDrop.sourceIndex === resolvedDrop.destinationIndex) return;

    // Sortable indices exclude the pinned label-identifier column at visibleRecordFields[0],
    // so shift by one to address the full visible field list.
    const updatedRecordField = reorderVisibleRecordFields({
      fromIndex: resolvedDrop.sourceIndex + 1,
      toIndex: resolvedDrop.destinationIndex + 1,
    });

    const currentViewId = store.get(currentViewIdCallbackState);
    const currentView = isDefined(currentViewId)
      ? getViewFromState(currentViewId)
      : undefined;

    saveViewFields([
      mapRecordFieldToViewFieldFromCurrentView(
        updatedRecordField,
        currentView?.viewFields ?? [],
      ),
    ]);
  };

  const contextValues: RecordTableHeaderDndKitContextValues = {
    activeDropTargetIndex,
  };

  return {
    contextValues,
    handlers: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
    },
  };
};
