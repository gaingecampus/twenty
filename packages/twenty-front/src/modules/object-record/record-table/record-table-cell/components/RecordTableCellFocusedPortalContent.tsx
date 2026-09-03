import { useRecordTableBodyContextOrThrow } from '@/object-record/record-table/contexts/RecordTableBodyContext';
import { recordTableFocusPositionComponentState } from '@/object-record/record-table/states/recordTableFocusPositionComponentState';
import { recordTableHoverPositionComponentState } from '@/object-record/record-table/states/recordTableHoverPositionComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledRecordTableCellFocusPortalContent = styled.div`
  box-sizing: border-box;
  display: flex;
  inset: 0;
  pointer-events: none;
  position: absolute;
  user-select: none;

  &::after {
    box-shadow: 0 0 0 1px ${themeCssVariables.color.blue8};
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
`;

export const RecordTableCellFocusedPortalContent = () => {
  const { onMoveHoverToCurrentCell } = useRecordTableBodyContextOrThrow();

  const recordTableFocusPosition = useAtomComponentStateValue(
    recordTableFocusPositionComponentState,
  );

  const recordTableHoverPosition = useAtomComponentStateValue(
    recordTableHoverPositionComponentState,
  );

  const arePositionsDifferent =
    recordTableHoverPosition?.row !== recordTableFocusPosition?.row ||
    recordTableHoverPosition?.column !== recordTableFocusPosition?.column;

  const handleContainerMouseMove = () => {
    if (arePositionsDifferent && isDefined(recordTableFocusPosition)) {
      onMoveHoverToCurrentCell(recordTableFocusPosition);
    }
  };

  return (
    <StyledRecordTableCellFocusPortalContent
      onMouseMove={handleContainerMouseMove}
    />
  );
};
