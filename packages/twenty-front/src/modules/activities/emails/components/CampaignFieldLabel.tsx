import { styled } from '@linaria/react';
import { useId } from 'react';
import { IconInfoCircle } from 'twenty-ui/icon';
import { AppTooltip, TooltipDelay } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFieldLabel = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  line-height: var(--t-label-line-height, 1.4);
`;

const StyledInfoButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: help;
  display: inline-flex;
  padding: 0;
`;

export const CampaignFieldLabel = ({
  label,
  help,
}: {
  label: string;
  help: string;
}) => {
  const id = `campaign-help-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <StyledFieldLabel>
      {label}
      <StyledInfoButton id={id} type="button" aria-label={`${label} 도움말`}>
        <IconInfoCircle size={16} />
      </StyledInfoButton>
      <AppTooltip
        anchorSelect={`#${id}`}
        content={help}
        place="top"
        delay={TooltipDelay.shortDelay}
        positionStrategy="fixed"
      />
    </StyledFieldLabel>
  );
};
