import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'twenty-ui/input';
import { IconExternalLink } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

export const CampaignRecipientHeader = ({
  children,
}: {
  children: ReactNode;
}) => (
  <StyledHeader>
    {children}
    <Button
      title="고객 분류 관리"
      Icon={IconExternalLink}
      variant="secondary"
      accent="blue"
      size="small"
      onClick={() =>
        window.open('/objects/messageLists', '_blank', 'noopener,noreferrer')
      }
    />
  </StyledHeader>
);
