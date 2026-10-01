import { RecordTableScrollbars } from '@/object-record/record-table/components/RecordTableScrollbars';
import { styled } from '@linaria/react';

import { useContext, useRef } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { RecordBoardColumnWidthEffect } from '@/object-record/record-board/components/RecordBoardColumnWidthEffect';
import { RecordBoardColumns } from '@/object-record/record-board/components/RecordBoardColumns';
import { RecordBoardDragDropContext } from '@/object-record/record-board/components/RecordBoardDragDropContext';
import { RecordBoardDragSelect } from '@/object-record/record-board/components/RecordBoardDragSelect';
import { RecordBoardEffects } from '@/object-record/record-board/components/RecordBoardEffects';
import { RecordBoardFetchMoreInViewTriggerComponent } from '@/object-record/record-board/components/RecordBoardFetchMoreInViewTriggerComponent';
import { RecordBoardHeader } from '@/object-record/record-board/components/RecordBoardHeader';
import { RecordBoardContext } from '@/object-record/record-board/contexts/RecordBoardContext';
import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';

import { getRecordBoardHtmlId } from '@/object-record/record-board/utils/getRecordBoardHtmlId';

const StyledContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100%;
  position: relative;
`;

const StyledContainerContainer = styled.div`
  background: var(--t-view-canvas-bg, ${themeCssVariables.background.primary});
  background-image: radial-gradient(
    ${themeCssVariables.border.color.medium} 1px,
    transparent 1px
  );
  background-size: 20px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: min-content;
  min-height: 100%;
  min-width: 100%;
  width: max-content;
`;

const StyledBoardContentContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-inline: max(
    0px,
    calc(
      var(--t-page-header-padding-x, ${themeCssVariables.spacing[3]}) -
        ${themeCssVariables.spacing[2]}
    )
  );
`;

const StyledBoardScrollbars = styled(RecordTableScrollbars)`
  background: var(--t-view-canvas-bg, ${themeCssVariables.background.primary});
  border-radius: 0;
  box-sizing: border-box;
  height: 100%;
  padding: 0 6px 6px 0;

  [data-scrollbar-thumb] {
    background: ${themeCssVariables.border.color.strong};
  }
`;

export const RecordBoard = () => {
  const { recordBoardId } = useContext(RecordBoardContext);
  const boardRef = useRef<HTMLDivElement>(null);
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();

  return (
    <StyledBoardScrollbars
      recordTableId={recordBoardId}
      scrollWrapperId={`scroll-wrapper-scroll-wrapper-record-board-${recordBoardId}`}
    >
      <ScrollWrapper
        componentInstanceId={`scroll-wrapper-record-board-${recordBoardId}`}
      >
        <RecordBoardEffects />
        <RecordBoardColumnWidthEffect />
        <StyledContainerContainer id={getRecordBoardHtmlId(recordBoardId)}>
          <RecordBoardHeader />
          <StyledBoardContentContainer>
            <StyledContainer ref={boardRef}>
              <RecordBoardDragDropContext>
                <RecordBoardColumns />
              </RecordBoardDragDropContext>
              {isInlineEditEnabled && (
                <RecordBoardDragSelect boardRef={boardRef} />
              )}
              <RecordBoardFetchMoreInViewTriggerComponent />
            </StyledContainer>
          </StyledBoardContentContainer>
        </StyledContainerContainer>
      </ScrollWrapper>
    </StyledBoardScrollbars>
  );
};
