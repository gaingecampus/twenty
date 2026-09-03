import { themeCssVariables } from 'twenty-ui/theme-constants';
import { styled } from '@linaria/react';

type StyledDropdownButtonProps = {
  isUnfolded?: boolean;
  isActive?: boolean;
};

export const StyledHeaderDropdownButton = styled.button<StyledDropdownButtonProps>`
  align-items: center;
  background: ${({ isUnfolded }) =>
    isUnfolded
      ? `var(--t-toolbar-chip-active-bg, ${themeCssVariables.background.transparent.light})`
      : `var(--t-toolbar-chip-bg, ${themeCssVariables.background.primary})`};
  border: var(--t-toolbar-chip-border, none);
  border-radius: var(
    --t-toolbar-chip-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-sizing: border-box;
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: var(--t-toolbar-chip-font-size, inherit);
  font-weight: var(--t-toolbar-chip-font-weight, inherit);
  height: var(--t-toolbar-chip-height, auto);
  padding: var(--t-toolbar-chip-padding-y, ${themeCssVariables.spacing[1]})
    var(--t-toolbar-chip-padding-x, ${themeCssVariables.spacing[2]});
  user-select: none;

  &:hover {
    background: ${({ isUnfolded }) =>
      isUnfolded
        ? `var(--t-toolbar-chip-active-bg, ${themeCssVariables.background.transparent.medium})`
        : `var(--t-toolbar-chip-hover-bg, ${themeCssVariables.background.transparent.light})`};
  }

  &[data-toolbar-chip='icon'] {
    justify-content: center;
    padding-inline: var(
      --t-toolbar-chip-icon-padding-x,
      ${themeCssVariables.spacing[1]}
    );
    width: var(--t-toolbar-chip-icon-size, var(--t-toolbar-chip-height, auto));
  }
`;
