import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { campaignBodyToText } from '@/activities/emails/utils/campaignDisplay';

const StyledBody = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  line-height: 1.6;
  min-height: 180px;
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[3]};
  white-space: pre-wrap;
`;

export const CampaignBodyDisplay = ({ value }: { value: unknown }) => (
  <StyledBody aria-label="발송 본문">
    {campaignBodyToText(typeof value === 'string' ? value : '') || '본문 없음'}
  </StyledBody>
);
