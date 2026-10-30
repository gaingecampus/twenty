import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledMessageListToolbar = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-end;
`;

export const StyledMessageListEmpty = styled.div`
  background: ${themeCssVariables.background.secondary};
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;
