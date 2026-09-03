import { themeCssVariables } from 'twenty-ui/theme-constants';
import { styled } from '@linaria/react';

const StyledDropdownMenuSectionLabel = styled.div`
  align-items: center;
  background-color: var(
    --t-overlay-section-bg,
    ${themeCssVariables.background.transparent.lighter}
  );
  color: var(
    --t-overlay-section-color,
    ${themeCssVariables.font.color.tertiary}
  );
  display: flex;
  font-size: var(
    --t-overlay-section-font-size,
    ${themeCssVariables.font.size.xxs}
  );
  font-weight: var(
    --t-overlay-section-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
  justify-content: flex-start;
  min-height: var(--t-overlay-section-min-height, 20px);
  padding-bottom: var(--t-overlay-section-padding-y, 0);
  padding-left: var(
    --t-overlay-section-padding-x,
    ${themeCssVariables.spacing[1]}
  );
  padding-right: var(
    --t-overlay-section-padding-x,
    ${themeCssVariables.spacing[1]}
  );
  padding-top: var(--t-overlay-section-padding-y, 0);
  user-select: none;
  width: auto;
`;

export type DropdownMenuSectionLabelProps = {
  label: string;
};

export const DropdownMenuSectionLabel = ({
  label,
}: DropdownMenuSectionLabelProps) => {
  return (
    <StyledDropdownMenuSectionLabel>{label}</StyledDropdownMenuSectionLabel>
  );
};
