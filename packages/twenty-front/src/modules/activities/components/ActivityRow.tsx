import { styled } from '@linaria/react';
import React from 'react';
import { CardContent } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledRowContentContainer = styled.div<{ $autoHeight?: boolean }>`
  > div {
    align-items: center;
    box-sizing: border-box;
    display: flex;
    gap: ${themeCssVariables.spacing[2]};
    height: ${({ $autoHeight }) =>
      $autoHeight === true ? 'auto' : themeCssVariables.spacing[12]};
    min-height: ${themeCssVariables.spacing[12]};
    padding: ${({ $autoHeight }) =>
      $autoHeight === true
        ? `${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]}`
        : `${themeCssVariables.spacing[0]} ${themeCssVariables.spacing[4]}`};
  }

  > div[data-clickable='false'] {
    cursor: default;
  }
`;

export const ActivityRow = ({
  children,
  onClick,
  disabled,
  autoHeight,
}: React.PropsWithChildren<{
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  autoHeight?: boolean;
}>) => {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled !== true) {
      onClick?.(event);
    }
  };

  return (
    <StyledRowContentContainer $autoHeight={autoHeight}>
      <CardContent onClick={handleClick} isClickable={disabled !== true}>
        {children}
      </CardContent>
    </StyledRowContentContainer>
  );
};
