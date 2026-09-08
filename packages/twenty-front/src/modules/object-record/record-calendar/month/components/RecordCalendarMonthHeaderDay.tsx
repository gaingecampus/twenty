import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type RecordCalendarMonthHeaderDayProps = {
  label: string;
};

const StyledLabel = styled.div`
  align-items: center;
  background: var(--t-view-canvas-bg, transparent);
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: var(--t-calendar-weekday-height, 24px);
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[0]} ${themeCssVariables.spacing[1]};
  width: calc(100% / 7);
`;

export const RecordCalendarMonthHeaderDay = ({
  label,
}: RecordCalendarMonthHeaderDayProps) => {
  return <StyledLabel>{label}</StyledLabel>;
};
