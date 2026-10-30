import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledCampaignCheckboxLabel = styled.label`
  && {
    align-items: center;
    cursor: pointer;
    display: inline-flex;
    flex-direction: row;
    gap: ${themeCssVariables.spacing[2]};
  }

  & [role='checkbox'] {
    --checkbox-box-radius: calc(${themeCssVariables.border.radius.xs} / 2);
  }
`;
