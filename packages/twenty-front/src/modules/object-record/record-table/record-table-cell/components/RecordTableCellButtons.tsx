import { styled } from '@linaria/react';
import { type IconComponent } from 'twenty-ui/icon';
import { LightIconButtonGroup } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledButtonAligner = styled.div`
  align-items: stretch;
  display: flex;
  height: 100%;
  justify-content: flex-end;
  pointer-events: none;
  width: 100%;
`;

const StyledButtonContainer = styled.div`
  --t-icon-button-radius: 0;
  align-items: stretch;
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  box-sizing: border-box;
  display: flex;
  height: 100%;
  pointer-events: auto;
  z-index: 1;

  & > div {
    align-items: stretch;
    display: flex;
    height: 100%;
  }

  button {
    border-radius: 0;
    height: 100%;
    min-height: 100%;
    min-width: var(--t-control-height-md, 40px);
    width: var(--t-control-height-md, 40px);
  }
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
      <StyledButtonContainer>
        <LightIconButtonGroup size="medium" iconButtons={buttons} />
      </StyledButtonContainer>
    </StyledButtonAligner>
  );
};
