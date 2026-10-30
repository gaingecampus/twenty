import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledDispatchForm = styled.div`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[8]};
  section {
    display: flex;
    flex-direction: column;
    gap: ${themeCssVariables.spacing[3]};
  }
  p,
  pre {
    margin: 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: ${themeCssVariables.spacing[2]};
  }
  label:has(input[type='checkbox']) {
    flex-direction: row;
    align-items: center;
  }
  small {
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.5;
  }
  input,
  textarea {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: ${themeCssVariables.border.radius.sm};
    box-sizing: border-box;
    color: inherit;
    font: inherit;
    font-size: ${themeCssVariables.font.size.md};
    padding: ${themeCssVariables.spacing[3]};
    width: 100%;
  }
  input:not([type='checkbox']) {
    height: var(--t-input-height, ${themeCssVariables.spacing[8]});
    padding: 0 var(--t-input-padding-x, ${themeCssVariables.spacing[2]});
  }
  textarea {
    min-height: 160px;
    resize: vertical;
  }
  input[type='checkbox'] {
    width: auto;
  }
  pre {
    font: inherit;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
`;
export const StyledDispatchCard = styled.section`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;
