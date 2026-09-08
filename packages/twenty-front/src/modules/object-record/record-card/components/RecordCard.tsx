import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledBoardCard = styled.div<{
  isDragging?: boolean;
  isSecondaryDragged?: boolean;
  isPrimaryMultiDrag?: boolean;
}>`
  background-color: var(
    --t-record-card-bg,
    ${themeCssVariables.background.secondary}
  );
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: var(
    --t-record-card-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-shadow: var(--t-record-card-shadow, none);
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  opacity: ${({ isSecondaryDragged }) => (isSecondaryDragged ? '0.3' : '1')};

  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
  width: 100%;

  &:focus-within {
    outline: 2px solid ${themeCssVariables.color.blue7};
    outline-offset: 2px;
  }

  &[data-selected='true'] {
    background-color: ${themeCssVariables.accent.quaternary};
  }

  &[data-focused='true'] {
    background-color: ${themeCssVariables.background.tertiary};
  }

  &[data-active='true'] {
    background-color: ${themeCssVariables.accent.quaternary};
    border: 1px solid ${themeCssVariables.color.blue7};
  }

  &:hover {
    border: 1px solid ${themeCssVariables.border.color.strong};

    &[data-active='true'] {
      border: 1px solid ${themeCssVariables.color.blue7};
    }
  }

  .checkbox-container {
    flex-shrink: 0;
    max-width: var(--t-record-card-control-width, 0);
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    transition: opacity ease-in-out 160ms;
  }

  &:focus-within .checkbox-container,
  &[data-selected='true'] .checkbox-container,
  &:hover .checkbox-container {
    max-width: ${themeCssVariables.spacing[6]};
    opacity: 1;
    pointer-events: auto;
  }

  .compact-icon-container {
    opacity: 0;
    transition: opacity ease-in-out 160ms;
  }
  &:focus-within .compact-icon-container,
  &:hover .compact-icon-container {
    opacity: 1;
  }
`;

export { StyledBoardCard as RecordCard };
