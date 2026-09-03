import { styled } from '@linaria/react';
import { type IconComponent } from 'twenty-ui/icon';
import { LightIconButtonGroup } from 'twenty-ui/input';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';
import { AnimatedContainer } from 'twenty-ui/layout';

const StyledButtonAligner = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: flex-end;
  padding-right: ${themeCssVariables.spacing[1]};
  pointer-events: none;
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding-right: 7px;
  }
`;

const StyledButtonContainer = styled.div`
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: ${themeCssVariables.border.radius.sm};
  pointer-events: auto;
  z-index: 1;
`;

type RecordTableCellButtonsProps = {
  onClick?: () => void;
  Icon: IconComponent;
}[];

export const RecordTableCellButtons = ({
  buttons,
}: {
  buttons: RecordTableCellButtonsProps;
}) => {
  return (
    <StyledButtonAligner>
      <AnimatedContainer>
        <StyledButtonContainer>
          <LightIconButtonGroup size="small" iconButtons={buttons} />
        </StyledButtonContainer>
      </AnimatedContainer>
    </StyledButtonAligner>
  );
};
