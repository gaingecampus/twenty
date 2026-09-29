import { styled } from '@linaria/react';
import { IconFileText } from 'twenty-ui/icon';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
const StyledLabel = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 6px;
  max-width: 100%;
  vertical-align: middle;
  > span:first-child {
    align-items: center;
    background: ${theme.background.transparent.blue};
    border-radius: 6px;
    color: ${theme.color.blue};
    display: inline-flex;
    flex-shrink: 0;
    height: 24px;
    justify-content: center;
    width: 24px;
  }
  > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
export const FieldContractLabel = ({ name }: { name: string }) => (
  <StyledLabel title={name}>
    <span>
      <IconFileText size={14} aria-hidden="true" />
    </span>
    <span>{name}</span>
  </StyledLabel>
);
