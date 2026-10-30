import { styled } from '@linaria/react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledCampaignDraftSaveButton = styled(Button)`
  &&&&:not([data-disabled]) {
    --btn-active-bg: var(--btn-hover-bg);
    --btn-bg: var(
      --t-inline-edit-bg,
      ${themeCssVariables.background.primaryInverted}
    );
    --btn-color: var(
      --t-inline-edit-color,
      ${themeCssVariables.font.color.inverted}
    );
    --btn-hover-bg: var(
      --t-inline-edit-hover-bg,
      ${themeCssVariables.background.primaryInvertedHover}
    );
  }
`;
