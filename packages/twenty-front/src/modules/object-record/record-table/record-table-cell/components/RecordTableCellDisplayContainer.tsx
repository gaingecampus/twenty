import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { type Ref } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledOuterContainer = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  overflow: hidden;
  padding-left: ${themeCssVariables.table.horizontalCellPadding};
  width: 100%;
`;

const StyledInnerContainer = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;

  a:has([data-testid='chip']) {
    display: inline-flex;
    max-width: 100%;
    min-width: 0;
  }

  [data-testid='chip'] {
    box-sizing: border-box;
    height: calc(var(--t-avatar-size-sm) + 2 * var(--t-spacing-1));
    max-width: 100%;
    overflow: visible;
  }
`;

const StyledEmptyPlaceholderField = styled.div`
  color: ${themeCssVariables.font.color.light};
  padding-left: 4px;
`;

export type EditableCellDisplayContainerProps = {
  focus?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  scrollRef?: Ref<HTMLDivElement>;
  isHovered?: boolean;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  placeholderForEmptyCell?: string;
};

export const RecordTableCellDisplayContainer = ({
  children,
  focus,
  onClick,
  scrollRef,
  onContextMenu,
  placeholderForEmptyCell,
}: React.PropsWithChildren<EditableCellDisplayContainerProps>) => (
  <StyledOuterContainer
    data-testid={
      focus ? 'editable-cell-focus-mode' : 'editable-cell-display-mode'
    }
    onClick={onClick}
    ref={scrollRef}
    onContextMenu={onContextMenu}
  >
    {placeholderForEmptyCell ? (
      <StyledEmptyPlaceholderField>
        {t`Set ${placeholderForEmptyCell}`}
      </StyledEmptyPlaceholderField>
    ) : (
      <StyledInnerContainer>{children}</StyledInnerContainer>
    )}
  </StyledOuterContainer>
);
