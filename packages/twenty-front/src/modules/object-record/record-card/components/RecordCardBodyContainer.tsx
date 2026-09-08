import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCardBodyContainer = styled.div<{ padding?: string }>`
  display: flex;
  flex-direction: column;
  gap: var(--t-record-card-field-gap, ${themeCssVariables.spacing['0.5']});
  padding: ${({ padding }) =>
    padding ??
    `0 ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]} 10px`};
  padding-top: var(--t-record-card-body-top, 0);
  span {
    align-items: center;
    display: flex;
    flex-direction: row;
    svg {
      color: ${themeCssVariables.font.color.tertiary};
      margin-right: ${themeCssVariables.spacing[2]};
    }
  }
`;

export { StyledCardBodyContainer as RecordCardBodyContainer };
