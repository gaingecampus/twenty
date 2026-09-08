import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { ViewPickerViewOptionsMenuContent } from '@/views/view-picker/components/ViewPickerViewOptionsMenuContent';
import { IconDotsVertical } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { DragDropContext, type DropResult, Droppable } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { type KeyboardEvent, type MouseEvent, useCallback } from 'react';
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

const StyledTabsAndOptions = styled.div`
  align-items: center;
  display: flex;
  flex: 0 1 auto;
  gap: 4px;
  min-width: 0;
`;

const StyledTabList = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: var(--t-view-tab-gap, ${themeCssVariables.spacing[1]});
  min-width: 0;
  overflow-x: auto;
  padding: 3px;
  scrollbar-width: thin;
`;

const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (
    !(event.target instanceof HTMLElement) ||
    event.target.getAttribute('role') !== 'tab'
  )
    return;
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'),
  );
  const index = tabs.indexOf(event.target);
  let nextIndex = index;
  if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
  else if (event.key === 'ArrowLeft')
    nextIndex = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  tabs[nextIndex]?.focus();
  tabs[nextIndex]?.click();
};

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
        totalCount={currentView?.id === view.id ? totalCount : undefined}
        onSelect={handleViewSelect}
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

  const tabList = !canReorder ? (
    <StyledTabList
      role="tablist"
      aria-label="목록 뷰 선택"
      onKeyDown={handleTabKeyDown}
    >
      {tabItems}
    </StyledTabList>
  ) : (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable
        droppableId={VIEW_PICKER_TAB_LIST_DROPPABLE_ID}
        direction="horizontal"
      >
        {(provided) => (
          <StyledTabList
            role="tablist"
            aria-label="목록 뷰 선택"
            onKeyDown={handleTabKeyDown}
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

  const optionsDropdownId = `view-picker-current-view-options-${currentView?.id}`;

  return (
    <StyledTabsAndOptions>
      {tabList}
      {!isReadOnly && currentView && (
        <Dropdown
          key={currentView.id}
          dropdownId={optionsDropdownId}
          dropdownPlacement="bottom-start"
          clickableComponent={
            <LightIconButton
              Icon={IconDotsVertical}
              size="medium"
              accent="tertiary"
              aria-label={`${currentView.name} 뷰 옵션`}
              title={`${currentView.name} 뷰 옵션`}
            />
          }
          dropdownComponents={
            <ViewPickerViewOptionsMenuContent
              view={currentView}
              isIndexView={currentView.key === 'INDEX'}
              isLastView={isLastView}
              dropdownId={optionsDropdownId}
              onEdit={handleEditViewButtonClick}
            />
          }
        />
      )}
    </StyledTabsAndOptions>
  );
};
