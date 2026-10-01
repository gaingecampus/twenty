import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';

export const StyledFieldEmptyState = styled.p`
  align-items: center;
  background: ${theme.background.tertiary};
  border-radius: 8px;
  box-sizing: border-box;
  color: ${theme.font.color.tertiary};
  display: flex;
  font-size: ${theme.font.size.sm};
  justify-content: center;
  min-height: 112px;
  padding: 32px 24px;
  text-align: center;
  width: 100%;
`;
