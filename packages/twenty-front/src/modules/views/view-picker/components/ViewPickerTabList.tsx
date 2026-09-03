import {
  DragDropContext,
  type DropResult,
  Droppable,
} from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { type MouseEvent, useCallback } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useContextStoreObjectMetadataItemOrThrow } from '@/context-store/hooks/useContextStoreObjectMetadataItemOrThrow';
import { useOpenDropdown } from '@/ui/layout/dropdown/hooks/useOpenDropdown';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useGetRecordIndexTotalCount } from '@/views/hooks/internal/useGetRecordIndexTotalCount';
import { usePerformViewAPIUpdate } from '@/views/hooks/internal/usePerformViewAPIUpdate';
import { useChangeView } from '@/views/hooks/useChangeView';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { ViewPickerReorderableTab } from '@/views/view-picker/components/ViewPickerReorderableTab';
import { ViewPickerTab } from '@/views/view-picker/components/ViewPickerTab';
import { VIEW_PICKER_DROPDOWN_ID } from '@/views/view-picker/constants/ViewPickerDropdownId';
import { VIEW_PICKER_TAB_LIST_DROPPABLE_ID } from '@/views/view-picker/constants/ViewPickerTabListDroppableId';
import { useViewPickerMode } from '@/views/view-picker/hooks/useViewPickerMode';
import { viewPickerReferenceViewIdComponentState } from '@/views/view-picker/states/viewPickerReferenceViewIdComponentState';
import { ViewVisibility } from '~/generated-metadata/graphql';
import { moveArrayItem } from '~/utils/array/moveArrayItem';

const StyledTabList = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: var(--t-view-tab-gap, ${themeCssVariables.spacing[1]});
`;

type ViewPickerTabListProps = {
  isReadOnly?: boolean;
};

export const ViewPickerTabList = ({
  isReadOnly = false,
}: ViewPickerTabListProps) => {
  const { objectMetadataItem } = useContextStoreObjectMetadataItemOrThrow();

  const viewsOnCurrentObject = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );

  const visibleViews = viewsOnCurrentObject.filter(
    (view) =>
      view.visibility === ViewVisibility.WORKSPACE ||
      view.visibility === ViewVisibility.UNLISTED,
  );
  const isLastView = viewsOnCurrentObject.length <= 1;
  const canReorder = !isReadOnly && visibleViews.length > 1;

  const { currentView } = useGetCurrentViewOnly();
  const { totalCount } = useGetRecordIndexTotalCount();
  const { changeView } = useChangeView();
  const { openDropdown } = useOpenDropdown();
  const { setViewPickerMode } = useViewPickerMode();
  const { performViewAPIUpdate } = usePerformViewAPIUpdate();
  const setViewPickerReferenceViewId = useSetAtomComponentState(
    viewPickerReferenceViewIdComponentState,
  );

  const handleViewSelect = (viewId: string) => {
    changeView(viewId);
  };

  const handleEditViewButtonClick = (
    event: MouseEvent<HTMLElement>,
    viewId: string,
  ) => {
    event.stopPropagation();
    setViewPickerReferenceViewId(viewId);
    setViewPickerMode('edit');
    openDropdown({
      dropdownComponentInstanceIdFromProps: VIEW_PICKER_DROPDOWN_ID,
    });
  };

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) {
        return;
      }

      const viewsReordered = moveArrayItem(visibleViews, {
        fromIndex: result.source.index,
        toIndex: result.destination.index,
      });

      await Promise.all(
        viewsReordered.map(async (view, index) => {
          if (view.position !== index) {
            await performViewAPIUpdate({
              id: view.id,
              input: { position: index },
            });
          }
        }),
      );
    },
    [performViewAPIUpdate, visibleViews],
  );

  const tabItems = visibleViews.map((view, index) => {
    const tab = (
      <ViewPickerTab
        key={view.id}
        view={view}
        isCurrentView={currentView?.id === view.id}
        isIndexView={view.key === 'INDEX'}
        isLastView={isLastView}
        isReadOnly={isReadOnly}
        totalCount={currentView?.id === view.id ? totalCount : undefined}
        onSelect={handleViewSelect}
        onEdit={handleEditViewButtonClick}
      />
    );

    if (!canReorder) {
      return tab;
    }

    return (
      <ViewPickerReorderableTab
        key={view.id}
        draggableId={view.id}
        index={index}
      >
        {tab}
      </ViewPickerReorderableTab>
    );
  });

  if (!canReorder) {
    return <StyledTabList role="tablist">{tabItems}</StyledTabList>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable
        droppableId={VIEW_PICKER_TAB_LIST_DROPPABLE_ID}
        direction="horizontal"
      >
        {(provided) => (
          <StyledTabList
            role="tablist"
            ref={provided.innerRef}
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...provided.droppableProps}
          >
            {tabItems}
            {provided.placeholder}
          </StyledTabList>
        )}
      </Droppable>
    </DragDropContext>
  );
};
