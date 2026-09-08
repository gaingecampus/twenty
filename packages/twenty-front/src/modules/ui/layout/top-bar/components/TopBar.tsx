import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TopBarProps = {
  className?: string;
  leftComponent?: ReactNode;
  rightComponent?: ReactNode;
  bottomComponent?: ReactNode;
  displayBottomBorder?: boolean;
};

const StyledContainer = styled.div`
  border-bottom: var(
    --t-view-bar-border-bottom,
    1px solid ${themeCssVariables.border.color.light}
  );
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--t-view-bar-stack-gap, ${themeCssVariables.spacing[2]});
  padding: var(--t-view-bar-padding-x, ${themeCssVariables.spacing[3]});
`;

const StyledTopBar = styled.div`
  align-items: center;

  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: row;
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: var(--t-view-bar-section-gap, ${themeCssVariables.spacing[4]});
  height: var(--t-view-bar-min-height, 39px);
  justify-content: space-between;

  z-index: 7;

  @container (max-width: 700px) {
    align-items: stretch;
    flex-direction: column;
    height: auto;
  }
`;

const StyledLeftSection = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const StyledRightSection = styled.div`
  display: flex;
  flex-shrink: 0;
  font-weight: ${themeCssVariables.font.weight.regular};
  gap: var(--t-toolbar-chip-gap, ${themeCssVariables.betweenSiblingsGap});
`;

export const TopBar = ({
  className,
  leftComponent,
  rightComponent,
  bottomComponent,
}: TopBarProps) => (
  <StyledContainer className={className}>
    <StyledTopBar>
      <StyledLeftSection>{leftComponent}</StyledLeftSection>
      <StyledRightSection>{rightComponent}</StyledRightSection>
    </StyledTopBar>
    {bottomComponent}
  </StyledContainer>
);
