import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldFocusStaticFocusedProvider } from '@/object-record/record-field/ui/contexts/FieldFocusContextProvider';
import { useIsFieldInputOnly } from '@/object-record/record-field/ui/hooks/useIsFieldInputOnly';
import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { TABLE_Z_INDEX } from '@/object-record/record-table/constants/TableZIndex';
import { RecordTableCellEditButton } from '@/object-record/record-table/record-table-cell/components/RecordTableCellEditButton';
import { RecordTableCellEditMode } from '@/object-record/record-table/record-table-cell/components/RecordTableCellEditMode';
import { RecordTableCellFieldInput } from '@/object-record/record-table/record-table-cell/components/RecordTableCellFieldInput';
import { RecordTableCellPortalRootContainer } from '@/object-record/record-table/record-table-cell/components/RecordTableCellPortalRootContainer';
import { useGetSecondaryRecordTableCellButton } from '@/object-record/record-table/record-table-cell/hooks/useGetSecondaryRecordTableCellButton';

import { recordTableHoverPositionComponentState } from '@/object-record/record-table/states/recordTableHoverPositionComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { useContext } from 'react';
import { useIsMobile } from 'twenty-ui/utilities';

const StyledRecordTableCellHoveredPortalContent = styled.div<{
  showInteractiveStyle: boolean;
}>`
  align-items: center;
  box-sizing: border-box;
  cursor: ${({ showInteractiveStyle }) =>
    showInteractiveStyle ? 'pointer' : 'default'};
  display: flex;
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: absolute;
  user-select: none;
  width: 100%;
`;

const StyledPointerEventsAuto = styled.div`
  pointer-events: auto;
`;

export const RecordTableCellHoveredPortalContent = () => {
  const recordTableHoverPosition = useAtomComponentStateValue(
    recordTableHoverPositionComponentState,
  );

  const isMobile = useIsMobile();

  const isFirstColumn = recordTableHoverPosition?.column === 0;

  const { isRecordFieldReadOnly: isReadOnly } = useContext(FieldContext);
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();

  const isFieldInputOnly =
    useIsFieldInputOnly() && !isReadOnly && isInlineEditEnabled;

  const secondaryButton = useGetSecondaryRecordTableCellButton();
  const hasSecondaryButton = secondaryButton.length > 0;

  const showMainButton = isFirstColumn || (isInlineEditEnabled && !isReadOnly);

  const showButton =
    !isFieldInputOnly &&
    (showMainButton || hasSecondaryButton) &&
    !(isMobile && isFirstColumn);

  const showInteractiveStyle =
    (isInlineEditEnabled && !isReadOnly) ||
    (isFirstColumn && showButton) ||
    hasSecondaryButton;

  if (!showButton && !isFieldInputOnly) {
    return null;
  }

  return (
    <RecordTableCellPortalRootContainer
      zIndex={TABLE_Z_INDEX.hoverPortal}
      style={{ pointerEvents: 'none' }}
    >
      <StyledRecordTableCellHoveredPortalContent
        showInteractiveStyle={showInteractiveStyle}
      >
        {isFieldInputOnly ? (
          <StyledPointerEventsAuto>
            <FieldFocusStaticFocusedProvider>
              <RecordTableCellEditMode>
                <RecordTableCellFieldInput />
              </RecordTableCellEditMode>
            </FieldFocusStaticFocusedProvider>
          </StyledPointerEventsAuto>
        ) : (
          showButton && <RecordTableCellEditButton />
        )}
      </StyledRecordTableCellHoveredPortalContent>
    </RecordTableCellPortalRootContainer>
  );
};
