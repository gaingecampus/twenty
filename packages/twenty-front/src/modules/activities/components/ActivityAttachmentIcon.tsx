import { styled } from '@linaria/react';
import { IconPaperclip } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledAttachmentIcon = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
`;

export const ActivityAttachmentIcon = () => {
  return (
    <StyledAttachmentIcon>
      <IconPaperclip size={14} />
    </StyledAttachmentIcon>
  );
};
