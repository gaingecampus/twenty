import { styled } from '@linaria/react';
import { useInView } from 'react-intersection-observer';

import { COMMAND_MENU_DROPDOWN_CLICK_OUTSIDE_ID } from '@/command-menu-item/constants/CommandMenuDropdownClickOutsideId';
import { COMMAND_MENU_CLICK_OUTSIDE_ID } from '@/command-menu/constants/CommandMenuClickOutsideId';
import { RECORD_GALLERY_CLICK_OUTSIDE_LISTENER_ID } from '@/object-record/record-gallery/constants/RecordGalleryClickOutsideListenerId';
import { RecordGalleryCard } from '@/object-record/record-gallery/record-gallery-card/components/RecordGalleryCard';
import { RECORD_GALLERY_CARD_CLICK_OUTSIDE_ID } from '@/object-record/record-gallery/record-gallery-card/constants/RecordGalleryCardClickOutsideId';
import { RecordGalleryComponentInstanceContext } from '@/object-record/record-gallery/states/contexts/RecordGalleryComponentInstanceContext';
import { useRecordGallerySelection } from '@/object-record/record-gallery/states/selectors/useRecordGallerySelection';
import { useRecordIndexTableQuery } from '@/object-record/record-index/hooks/useRecordIndexTableQuery';
import { recordIndexAllRecordIdsComponentSelector } from '@/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector';
import { useRecordGalleryContextOrThrow } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { MODAL_BACKDROP_CLICK_OUTSIDE_ID } from '@/ui/layout/modal/constants/ModalBackdropClickOutsideId';
import { PAGE_ACTION_CONTAINER_CLICK_OUTSIDE_ID } from '@/ui/layout/page/constants/PageActionContainerClickOutsideId';
import { useListenClickOutside } from '@/ui/utilities/pointer-event/hooks/useListenClickOutside';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { LINK_CHIP_CLICK_OUTSIDE_ID } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useEffect } from 'react';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  height: 100%;
  padding: ${themeCssVariables.spacing[2]};
  padding-left: ${themeCssVariables.spacing[1]};
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  padding: ${themeCssVariables.spacing[1]};
`;

const StyledFetchMoreTrigger = styled.div`
  height: 1px;
  width: 100%;
`;

export const RecordGallery = () => {
  const recordGalleryId = useAvailableComponentInstanceIdOrThrow(
    RecordGalleryComponentInstanceContext,
  );

  const { objectNameSingular } = useRecordGalleryContextOrThrow();

  const { resetRecordSelection } = useRecordGallerySelection(recordGalleryId);

  const recordIds = useAtomComponentSelectorValue(
    recordIndexAllRecordIdsComponentSelector,
    recordGalleryId,
  );

  const { hasNextPage, fetchMoreRecords } = useRecordIndexTableQuery(
    objectNameSingular,
  );

  const { ref: fetchMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchMoreRecords();
    }
  }, [fetchMoreRecords, hasNextPage, inView]);

  useListenClickOutside({
    excludedClickOutsideIds: [
      COMMAND_MENU_DROPDOWN_CLICK_OUTSIDE_ID,
      COMMAND_MENU_CLICK_OUTSIDE_ID,
      MODAL_BACKDROP_CLICK_OUTSIDE_ID,
      PAGE_ACTION_CONTAINER_CLICK_OUTSIDE_ID,
      RECORD_GALLERY_CARD_CLICK_OUTSIDE_ID,
      LINK_CHIP_CLICK_OUTSIDE_ID,
    ],
    listenerId: RECORD_GALLERY_CLICK_OUTSIDE_LISTENER_ID,
    refs: [],
    callback: () => {
      resetRecordSelection();
    },
  });

  return (
    <StyledContainer>
      <ScrollWrapper
        componentInstanceId={`scroll-wrapper-record-gallery-${recordGalleryId}`}
      >
        <StyledGrid>
          {recordIds.map((recordId) => (
            <RecordGalleryCard key={recordId} recordId={recordId} />
          ))}
        </StyledGrid>
        {hasNextPage && <StyledFetchMoreTrigger ref={fetchMoreRef} />}
      </ScrollWrapper>
    </StyledContainer>
  );
};
