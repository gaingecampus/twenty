import { recordIndexCommandMenuDropdownPositionComponentState } from '@/command-menu-item/states/recordIndexCommandMenuDropdownPositionComponentState';
import { getCommandMenuDropdownIdFromCommandMenuId } from '@/command-menu-item/utils/getCommandMenuDropdownIdFromCommandMenuId';
import { getCommandMenuIdFromRecordIndexId } from '@/command-menu-item/utils/getCommandMenuIdFromRecordIndexId';
import { RecordGalleryCardCellEditModePortal } from '@/object-record/record-gallery/record-gallery-card/anchored-portal/components/RecordGalleryCardCellEditModePortal';
import { RecordGalleryCardCellHoveredPortal } from '@/object-record/record-gallery/record-gallery-card/anchored-portal/components/RecordGalleryCardCellHoveredPortal';
import { RecordGalleryCardBody } from '@/object-record/record-gallery/record-gallery-card/components/RecordGalleryCardBody';
import { RecordGalleryCardHeader } from '@/object-record/record-gallery/record-gallery-card/components/RecordGalleryCardHeader';
import { RECORD_GALLERY_CARD_CLICK_OUTSIDE_ID } from '@/object-record/record-gallery/record-gallery-card/constants/RecordGalleryCardClickOutsideId';
import { RECORD_GALLERY_CARD_INPUT_ID_PREFIX } from '@/object-record/record-gallery/record-gallery-card/constants/RecordGalleryCardInputIdPrefix';
import { RecordGalleryCardComponentInstanceContext } from '@/object-record/record-gallery/record-gallery-card/states/contexts/RecordGalleryCardComponentInstanceContext';
import { isRecordGalleryCardSelectedComponentFamilyState } from '@/object-record/record-gallery/record-gallery-card/states/isRecordGalleryCardSelectedComponentFamilyState';
import { RecordGalleryComponentInstanceContext } from '@/object-record/record-gallery/states/contexts/RecordGalleryComponentInstanceContext';
import { RecordCard } from '@/object-record/record-card/components/RecordCard';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { useOpenDropdown } from '@/ui/layout/dropdown/hooks/useOpenDropdown';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useAtomComponentFamilyState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyState';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { styled } from '@linaria/react';
import { AnimatedEaseInOut } from 'twenty-ui/layout';

const StyledContainer = styled.div`
  display: flex;
`;

const StyledRecordCardContainer = styled.div`
  width: calc(100% - 2px);
`;

type RecordGalleryCardProps = {
  recordId: string;
};

export const RecordGalleryCard = ({ recordId }: RecordGalleryCardProps) => {
  const { currentView } = useGetCurrentViewOnly();

  const isCompactModeActive = currentView?.isCompact ?? false;
  const [isRecordGalleryCardSelected, setIsRecordGalleryCardSelected] =
    useAtomComponentFamilyState(
      isRecordGalleryCardSelectedComponentFamilyState,
      recordId,
    );

  const recordGalleryId = useAvailableComponentInstanceIdOrThrow(
    RecordGalleryComponentInstanceContext,
  );

  const commandMenuId = getCommandMenuIdFromRecordIndexId(recordGalleryId);

  const commandMenuDropdownId =
    getCommandMenuDropdownIdFromCommandMenuId(commandMenuId);

  const setRecordIndexCommandMenuDropdownPosition = useSetAtomComponentState(
    recordIndexCommandMenuDropdownPositionComponentState,
    commandMenuDropdownId,
  );

  const { openDropdown } = useOpenDropdown();

  const handleContextMenuOpen = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsRecordGalleryCardSelected(true);
    setRecordIndexCommandMenuDropdownPosition({
      x: event.clientX,
      y: event.clientY,
    });
    openDropdown({
      dropdownComponentInstanceIdFromProps: commandMenuDropdownId,
      globalHotkeysConfig: {
        enableGlobalHotkeysWithModifiers: true,
        enableGlobalHotkeysConflictingWithKeyboard: false,
      },
    });
  };

  return (
    <RecordGalleryCardComponentInstanceContext.Provider
      value={{
        instanceId: recordId,
      }}
    >
      <RecordFieldsScopeContextProvider
        value={{ scopeInstanceId: RECORD_GALLERY_CARD_INPUT_ID_PREFIX }}
      >
        <StyledContainer onContextMenu={handleContextMenuOpen}>
          <StyledRecordCardContainer>
            <RecordCard
              data-selected={isRecordGalleryCardSelected}
              data-click-outside-id={RECORD_GALLERY_CARD_CLICK_OUTSIDE_ID}
            >
              <RecordGalleryCardHeader recordId={recordId} />
              <AnimatedEaseInOut isOpen={!isCompactModeActive} initial={false}>
                <RecordGalleryCardBody
                  recordId={recordId}
                  isRecordReadOnly={false}
                />
              </AnimatedEaseInOut>
            </RecordCard>
          </StyledRecordCardContainer>
          <RecordGalleryCardCellHoveredPortal recordId={recordId} />
          <RecordGalleryCardCellEditModePortal recordId={recordId} />
        </StyledContainer>
      </RecordFieldsScopeContextProvider>
    </RecordGalleryCardComponentInstanceContext.Provider>
  );
};
