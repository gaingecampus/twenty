import { InlineBanner } from 'twenty-ui/feedback';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledCouponSummary = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

export const StyledCouponBanner = styled(InlineBanner)`
  && {
    margin-bottom: 0;
  }
`;

export const StyledCouponValidationGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;
