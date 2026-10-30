import { InlineBanner } from 'twenty-ui/feedback';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledCouponSummary = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

export const StyledCouponActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const StyledCouponBanner = styled(InlineBanner)`
  margin-bottom: 0;
`;
