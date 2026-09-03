import { useContextStoreObjectMetadataItemOrThrow } from '@/context-store/hooks/useContextStoreObjectMetadataItemOrThrow';
import { useOpenDropdown } from '@/ui/layout/dropdown/hooks/useOpenDropdown';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useGetRecordIndexTotalCount } from '@/views/hooks/internal/useGetRecordIndexTotalCount';
import { useChangeView } from '@/views/hooks/useChangeView';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { ViewPickerTab } from '@/views/view-picker/components/ViewPickerTab';
import { VIEW_PICKER_DROPDOWN_ID } from '@/views/view-picker/constants/ViewPickerDropdownId';
import { useViewPickerMode } from '@/views/view-picker/hooks/useViewPickerMode';
import { viewPickerReferenceViewIdComponentState } from '@/views/view-picker/states/viewPickerReferenceViewIdComponentState';
import { styled } from '@linaria/react';
import { type MouseEvent } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { ViewVisibility } from '~/generated-metadata/graphql';

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

  const workspaceViews = viewsOnCurrentObject.filter(
    (view) => view.visibility === ViewVisibility.WORKSPACE,
  );

  const unlistedViews = viewsOnCurrentObject.filter(
    (view) => view.visibility === ViewVisibility.UNLISTED,
  );

  const visibleViews = [...workspaceViews, ...unlistedViews];
  const isLastView = viewsOnCurrentObject.length <= 1;

  const { currentView } = useGetCurrentViewOnly();
  const { totalCount } = useGetRecordIndexTotalCount();
  const { changeView } = useChangeView();
  const { openDropdown } = useOpenDropdown();
  const { setViewPickerMode } = useViewPickerMode();
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

  return (
    <StyledTabList role="tablist">
      {visibleViews.map((view) => (
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
      ))}
    </StyledTabList>
  );
};
