import { RecordTitleCellContext } from '@/object-record/record-title-cell/components/RecordTitleCellContext';
import { RecordTitleCellContainerType } from '@/object-record/record-title-cell/types/RecordTitleCellContainerType';
import { isTitleCellInEditModeComponentState } from '@/object-record/record-title-cell/states/isTitleCellInEditModeComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { styled } from '@linaria/react';

const StyledSummaryTitle = styled.div`
  align-items: center;
  display: grid;
  min-height: var(--t-input-height, 32px);
  min-width: 0;
  width: 100%;
`;

const StyledTitleLayer = styled.div<{ isHidden?: boolean }>`
  grid-area: 1 / 1;
  min-width: 0;
  visibility: ${({ isHidden }) => (isHidden ? 'hidden' : 'visible')};
`;

export const RecordTitleCellContainer = () => {
  const { displayModeContent, editModeContent, isReadOnly, containerType } =
    useContext(RecordTitleCellContext);

  const isTitleCellInEditMode = useAtomComponentStateValue(
    isTitleCellInEditModeComponentState,
  );

  if (containerType === RecordTitleCellContainerType.ShowPage) {
    const isEditing = !isReadOnly && isTitleCellInEditMode;

    return (
      <StyledSummaryTitle>
        <StyledTitleLayer isHidden={isEditing} aria-hidden={isEditing}>
          {displayModeContent}
        </StyledTitleLayer>
        {isEditing && <StyledTitleLayer>{editModeContent}</StyledTitleLayer>}
      </StyledSummaryTitle>
    );
  }

  if (isDefined(isReadOnly) && isReadOnly) {
    return <>{displayModeContent}</>;
  }

  return <>{isTitleCellInEditMode ? editModeContent : displayModeContent}</>;
};
