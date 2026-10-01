import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledLabel = styled.label`
  color: ${themeCssVariables.font.color.light};
  display: block;
  font-size: var(--t-input-label-font-size, 11px);
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 16px;
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

export const InputLabel = StyledLabel;
