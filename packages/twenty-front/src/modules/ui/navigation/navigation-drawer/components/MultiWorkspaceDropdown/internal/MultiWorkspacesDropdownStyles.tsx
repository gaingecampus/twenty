import { styled } from '@linaria/react';
import { IconChevronDown } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledContainer = styled.div<{
  isNavigationDrawerExpanded: boolean;
  disabled?: boolean;
}>`
  --t-avatar-font-size-md: var(--t-workspace-switcher-avatar-font-size, 12px);
  --t-avatar-radius: var(--t-workspace-switcher-avatar-radius, var(--t-avatar-radius));
  --t-avatar-size-md: var(--t-workspace-switcher-avatar-size, 16px);
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(
    --t-workspace-switcher-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  display: flex;
  gap: ${({ isNavigationDrawerExpanded }) =>
    isNavigationDrawerExpanded ? themeCssVariables.spacing[2] : '0'};
  height: var(
    --t-workspace-switcher-height,
    var(--t-nav-item-height, ${themeCssVariables.spacing[7]})
  );
  max-width: 100%;
  min-width: 0;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  padding: var(
    --t-workspace-switcher-padding,
    calc(${themeCssVariables.spacing[1]} - 1px)
  );
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  width: fit-content;

  &:hover {
    background-color: ${({ disabled }) =>
      disabled
        ? 'transparent'
        : `var(--t-workspace-switcher-hover-bg, ${themeCssVariables.background.transparent.lighter})`};
    border: ${({ disabled }) =>
      disabled
        ? '1px solid transparent'
        : `var(--t-workspace-switcher-hover-border, 1px solid ${themeCssVariables.border.color.medium})`};
  }
`;

export const StyledLabelWrapper = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
`;

export const StyledLabel = styled.div`
  font-size: var(--t-workspace-switcher-font-size, inherit);
  font-weight: var(
    --t-workspace-switcher-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
  letter-spacing: var(--t-heading-letter-spacing, 0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledIconChevronDownContainer = styled.div<{ disabled?: boolean }>`
  align-items: center;
  color: ${({ disabled }) =>
    disabled
      ? themeCssVariables.font.color.extraLight
      : themeCssVariables.font.color.tertiary};
  display: flex;
`;

export const StyledIconChevronDown = ({
  disabled,
  ...props
}: { disabled?: boolean } & React.ComponentProps<typeof IconChevronDown>) => (
  <StyledIconChevronDownContainer disabled={disabled}>
    {/* oxlint-disable-next-line react/jsx-props-no-spreading */}
    <IconChevronDown {...props} />
  </StyledIconChevronDownContainer>
);
