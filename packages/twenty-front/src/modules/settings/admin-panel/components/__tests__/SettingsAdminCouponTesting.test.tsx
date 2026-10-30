import { render, screen } from '@testing-library/react';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { SettingsAdminCouponTesting } from '@/settings/admin-panel/components/SettingsAdminCouponTesting';

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: jest.fn(),
}));
jest.mock(
  '@/activities/emails/components/coupon/CouponCampaignComposer',
  () => ({
    CouponCampaignComposer: ({ isAdminTesting }: { isAdminTesting: boolean }) =>
      isAdminTesting ? <div>쿠폰 관리자 테스트</div> : null,
  }),
);

it('does not expose testing controls without full administrator access', () => {
  jest
    .mocked(useAtomStateValue)
    .mockReturnValue({ canAccessFullAdminPanel: false });
  render(<SettingsAdminCouponTesting />);
  expect(screen.queryByText('쿠폰 관리자 테스트')).not.toBeInTheDocument();
});

it('opens the testing composer for a full administrator', () => {
  jest
    .mocked(useAtomStateValue)
    .mockReturnValue({ canAccessFullAdminPanel: true });
  render(<SettingsAdminCouponTesting />);
  expect(screen.getByText('쿠폰 관리자 테스트')).toBeInTheDocument();
});
