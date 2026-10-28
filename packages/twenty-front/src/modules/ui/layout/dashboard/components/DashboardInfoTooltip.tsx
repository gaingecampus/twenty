import { styled } from '@linaria/react';
import { useId } from 'react';
import { IconInfoCircle } from 'twenty-ui/icon';
import { AppTooltip, TooltipDelay } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledInfoButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: help;
  display: inline-flex;
  flex-shrink: 0;
  padding: ${themeCssVariables.spacing[1]};
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledDescription = styled.span`
  white-space: pre-line;
`;

export const DashboardInfoTooltip = ({
  label,
  description,
}: {
  label: string;
  description: string;
}) => {
  const infoId = useId();
  return (
    <>
      <StyledInfoButton
        type="button"
        data-dashboard-info={infoId}
        aria-label={`${label} 설명`}
        aria-description={description}
      >
        <IconInfoCircle size={16} aria-hidden />
      </StyledInfoButton>
      <AppTooltip
        anchorSelect={`[data-dashboard-info="${infoId}"]`}
        delay={TooltipDelay.noDelay}
      >
        <StyledDescription>{description}</StyledDescription>
      </AppTooltip>
    </>
  );
};
