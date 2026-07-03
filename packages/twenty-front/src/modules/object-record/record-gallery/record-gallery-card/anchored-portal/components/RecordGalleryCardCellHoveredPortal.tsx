import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';

import { useRecordGalleryContextOrThrow } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { RecordGalleryCardCellHoveredPortalContent } from '@/object-record/record-gallery/record-gallery-card/anchored-portal/components/RecordGalleryCardCellHoveredPortalContent';
import { RecordGalleryCardInputContextProvider } from '@/object-record/record-gallery/record-gallery-card/anchored-portal/components/RecordGalleryCardInputContextProvider';
import { RECORD_GALLERY_CARD_INPUT_ID_PREFIX } from '@/object-record/record-gallery/record-gallery-card/constants/RecordGalleryCardInputIdPrefix';
import { useRecordGalleryCardMetadataFromPosition } from '@/object-record/record-gallery/record-gallery-card/hooks/useRecordGalleryCardMetadataFromPosition';
import { recordGalleryCardHoverPositionComponentState } from '@/object-record/record-gallery/record-gallery-card/states/recordGalleryCardHoverPositionComponentState';
import { RecordInlineCellAnchoredPortal } from '@/object-record/record-inline-cell/components/RecordInlineCellAnchoredPortal';
import { isDefined } from 'twenty-shared/utils';

type RecordGalleryCardCellHoveredPortalProps = {
  recordId: string;
};

export const RecordGalleryCardCellHoveredPortal = ({
  recordId,
}: RecordGalleryCardCellHoveredPortalProps) => {
  const { objectMetadataItem } = useRecordGalleryContextOrThrow();

  const recordGalleryCardHoverPosition = useAtomComponentStateValue(
    recordGalleryCardHoverPositionComponentState,
  );

  const { hoveredFieldMetadataItem } =
    useRecordGalleryCardMetadataFromPosition();

  if (
    !isDefined(recordGalleryCardHoverPosition) ||
    !isDefined(hoveredFieldMetadataItem)
  ) {
    return null;
  }

  return (
    <RecordInlineCellAnchoredPortal
      fieldMetadataItem={hoveredFieldMetadataItem}
      objectMetadataItem={objectMetadataItem}
      recordId={recordId}
      instanceIdPrefix={RECORD_GALLERY_CARD_INPUT_ID_PREFIX}
    >
      <RecordGalleryCardInputContextProvider>
        <RecordGalleryCardCellHoveredPortalContent />
      </RecordGalleryCardInputContextProvider>
    </RecordInlineCellAnchoredPortal>
  );
};
