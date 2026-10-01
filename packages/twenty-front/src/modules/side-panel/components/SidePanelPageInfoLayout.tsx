import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledPageInfoContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

export const StyledPageInfoIcon = styled.div<{ iconColor?: string }>`
  align-items: center;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ iconColor }) => iconColor ?? ''};
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  padding: 0;
`;

export const StyledPageInfoTextContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing[0.5]};
  min-width: 0;
`;

export const StyledPageInfoTitleContainer = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  max-width: 150px;
  min-width: 0;
  padding-inline: ${themeCssVariables.spacing[1]};
`;

export const StyledPageInfoLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  white-space: nowrap;
`;

const StyledRecordType = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding-inline: ${themeCssVariables.spacing[1]};
  white-space: nowrap;
`;

const StyledRecordHeading = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[0.5]};
  min-width: 0;

  ${StyledPageInfoTitleContainer} {
    --record-title-justify-content: flex-start;
    text-align: left;
    font-size: 16px;
    line-height: 24px;
    width: 260px;
    max-width: 100%;
    height: 24px;

    input {
      border-radius: 4px;
      height: 24px;
      line-height: 24px;
    }
    padding-inline: 0;
  }

  ${StyledRecordType} {
    font-size: 11px;
    line-height: 14px;
    padding-inline: 5px;
  }
`;

type SidePanelPageInfoLayoutProps = {
  icon?: ReactNode;
  iconColor?: string;
  title: ReactNode;
  label?: ReactNode;
  recordType?: string;
  recordTypeTooltip?: string;
};

export const SidePanelPageInfoLayout = ({
  icon,
  iconColor,
  title,
  label,
  recordType,
  recordTypeTooltip,
}: SidePanelPageInfoLayoutProps) => {
  return (
    <StyledPageInfoContainer>
      {isDefined(icon) && (
        <StyledPageInfoIcon iconColor={iconColor}>{icon}</StyledPageInfoIcon>
      )}
      <StyledPageInfoTextContainer>
        {recordType ? (
          <StyledRecordHeading>
            <StyledPageInfoTitleContainer>{title}</StyledPageInfoTitleContainer>
            <StyledRecordType title={recordTypeTooltip}>
              {recordType}
              {isDefined(label) && <> · {label}</>}
            </StyledRecordType>
          </StyledRecordHeading>
        ) : (
          <StyledPageInfoTitleContainer>{title}</StyledPageInfoTitleContainer>
        )}
        {!recordType && isDefined(label) && (
          <StyledPageInfoLabel>{label}</StyledPageInfoLabel>
        )}
      </StyledPageInfoTextContainer>
    </StyledPageInfoContainer>
  );
};
