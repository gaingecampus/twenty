import { CouponCampaignComposer } from '@/activities/emails/components/coupon/CouponCampaignComposer';
import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const SettingsAdminCouponTesting = () => {
  const currentUser = useAtomStateValue(currentUserState);
  if (!currentUser?.canAccessFullAdminPanel) return null;

  return <CouponCampaignComposer isAdminTesting />;
};
