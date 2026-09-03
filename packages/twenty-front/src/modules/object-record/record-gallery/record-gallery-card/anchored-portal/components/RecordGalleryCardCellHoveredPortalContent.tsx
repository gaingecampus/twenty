import { RECORD_GALLERY_CARD_INPUT_ID_PREFIX } from '@/object-record/record-gallery/record-gallery-card/constants/RecordGalleryCardInputIdPrefix';
import { recordGalleryCardEditModePositionComponentState } from '@/object-record/record-gallery/record-gallery-card/states/recordGalleryCardEditModePositionComponentState';
import { recordGalleryCardHoverPositionComponentState } from '@/object-record/record-gallery/record-gallery-card/states/recordGalleryCardHoverPositionComponentState';
import { FieldDisplay } from '@/object-record/record-field/ui/components/FieldDisplay';
import { FieldInput } from '@/object-record/record-field/ui/components/FieldInput';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { useOpenFieldInputEditMode } from '@/object-record/record-field/ui/hooks/useOpenFieldInputEditMode';
import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { useRecordInlineCellContext } from '@/object-record/record-inline-cell/components/RecordInlineCellContext';
import { RecordInlineCellDisplayMode } from '@/object-record/record-inline-cell/components/RecordInlineCellDisplayMode';
import { RecordInlineCellHoveredPortalContent } from '@/object-record/record-inline-cell/components/RecordInlineCellHoveredPortalContent';
import { useInlineCell } from '@/object-record/record-inline-cell/hooks/useInlineCell';
import { getRecordFieldInputInstanceId } from '@/object-record/utils/getRecordFieldInputId';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useContext } from 'react';

export const RecordGalleryCardCellHoveredPortalContent = () => {
  const { editModeContentOnly, isCentered } = useRecordInlineCellContext();

  const { isRecordFieldReadOnly, recordId, fieldDefinition } =
    useContext(FieldContext);
  const { isInlineEditEnabled, assertInlineEditAllowed } =
    useGuardRecordIndexInlineEdit();

  const { openInlineCell } = useInlineCell(
    getRecordFieldInputInstanceId({
      recordId,
      fieldName: fieldDefinition.metadata.fieldName,
      prefix: RECORD_GALLERY_CARD_INPUT_ID_PREFIX,
    }),
  );

  const [recordGalleryCardHoverPosition, setRecordGalleryCardHoverPosition] =
    useAtomComponentState(recordGalleryCardHoverPositionComponentState);

  const setRecordGalleryCardEditModePosition = useSetAtomComponentState(
    recordGalleryCardEditModePositionComponentState,
  );
  const { openFieldInput } = useOpenFieldInputEditMode();

  const shouldShowFieldInput = editModeContentOnly && isInlineEditEnabled;

  const handleClick = () => {
    if (isRecordFieldReadOnly) {
      return;
    }

    if (!assertInlineEditAllowed()) {
      return;
    }

    if (editModeContentOnly) {
      return;
    }

    openInlineCell();
    setRecordGalleryCardEditModePosition(recordGalleryCardHoverPosition);

    openFieldInput({
      fieldDefinition,
      recordId,
      prefix: RECORD_GALLERY_CARD_INPUT_ID_PREFIX,
      onFileUploadClose: () => setRecordGalleryCardEditModePosition(null),
    });
  };

  const handleMouseLeave = () => {
    setRecordGalleryCardHoverPosition(null);
  };

  return (
    <RecordInlineCellHoveredPortalContent
      readonly={isRecordFieldReadOnly}
      isCentered={isCentered}
      onMouseLeave={handleMouseLeave}
    >
      <RecordInlineCellDisplayMode isHovered={true} onClick={handleClick}>
        {shouldShowFieldInput ? <FieldInput /> : <FieldDisplay />}
      </RecordInlineCellDisplayMode>
    </RecordInlineCellHoveredPortalContent>
  );
};
