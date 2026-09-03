import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';

import { useRecordGalleryContextOrThrow } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { RecordGalleryCardInputContextProvider } from '@/object-record/record-gallery/record-gallery-card/anchored-portal/components/RecordGalleryCardInputContextProvider';
import { RECORD_GALLERY_CARD_INPUT_ID_PREFIX } from '@/object-record/record-gallery/record-gallery-card/constants/RecordGalleryCardInputIdPrefix';
import { useRecordGalleryCardMetadataFromPosition } from '@/object-record/record-gallery/record-gallery-card/hooks/useRecordGalleryCardMetadataFromPosition';
import { recordGalleryCardEditModePositionComponentState } from '@/object-record/record-gallery/record-gallery-card/states/recordGalleryCardEditModePositionComponentState';
import { FieldInput } from '@/object-record/record-field/ui/components/FieldInput';
import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { RecordInlineCellAnchoredPortal } from '@/object-record/record-inline-cell/components/RecordInlineCellAnchoredPortal';
import { RecordInlineCellEditMode } from '@/object-record/record-inline-cell/components/RecordInlineCellEditMode';
import { isDefined } from 'twenty-shared/utils';

type RecordGalleryCardCellEditModePortalProps = {
  recordId: string;
};

export const RecordGalleryCardCellEditModePortal = ({
  recordId,
}: RecordGalleryCardCellEditModePortalProps) => {
  const { objectMetadataItem } = useRecordGalleryContextOrThrow();

  const recordGalleryCardEditModePosition = useAtomComponentStateValue(
    recordGalleryCardEditModePositionComponentState,
  );

  const { editedFieldMetadataItem } =
    useRecordGalleryCardMetadataFromPosition();
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();

  if (
    !isInlineEditEnabled ||
    !isDefined(recordGalleryCardEditModePosition) ||
    !isDefined(editedFieldMetadataItem)
  ) {
    return null;
  }

  return (
    <RecordInlineCellAnchoredPortal
      fieldMetadataItem={editedFieldMetadataItem}
      objectMetadataItem={objectMetadataItem}
      recordId={recordId}
      instanceIdPrefix={RECORD_GALLERY_CARD_INPUT_ID_PREFIX}
    >
      <RecordGalleryCardInputContextProvider>
        <RecordInlineCellEditMode>
          <FieldInput />
        </RecordInlineCellEditMode>
      </RecordGalleryCardInputContextProvider>
    </RecordInlineCellAnchoredPortal>
  );
};
