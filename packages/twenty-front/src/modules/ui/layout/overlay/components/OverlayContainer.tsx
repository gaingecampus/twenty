import { themeCssVariables } from 'twenty-ui/theme-constants';
import { styled } from '@linaria/react';

// oxlint-disable-next-line twenty/styled-components-prefixed-with-styled
export const OverlayContainer = styled.div<{
  borderRadius?: 'sm' | 'md';
  hasDangerBorder?: boolean;
}>`
  align-items: center;
  backdrop-filter: var(
    --t-overlay-backdrop-filter,
    ${themeCssVariables.blur.medium}
  );

  background: var(
    --t-overlay-bg,
    ${themeCssVariables.background.transparent.primary}
  );

  border: ${({ hasDangerBorder }) =>
    hasDangerBorder
      ? `1px solid ${themeCssVariables.border.color.danger}`
      : `var(--t-overlay-border, 1px solid ${themeCssVariables.border.color.medium})`};

  border-radius: ${({ borderRadius }) =>
    `var(--t-overlay-radius, ${themeCssVariables.border.radius[borderRadius ?? 'md']})`};
  box-shadow: var(
    --t-overlay-shadow,
    ${themeCssVariables.boxShadow.strong}
  );
  display: flex;

  overflow: hidden;

  z-index: 30;
`;
