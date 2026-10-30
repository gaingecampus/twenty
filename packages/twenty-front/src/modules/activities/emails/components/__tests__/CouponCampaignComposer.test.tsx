import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { CouponCampaignComposer } from '@/activities/emails/components/coupon/CouponCampaignComposer';
import { COUPON_CAPABILITIES } from '@/activities/emails/components/coupon/coupon-operations';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
jest.mock(
  '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker',
  () => ({
    FormSingleRecordPicker: () => null,
  }),
);
jest.mock('@/ui/input/components/Select', () => ({
  Select: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div>
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));
jest.mock('twenty-ui/feedback', () => ({
  AnimatedPlaceholder: () => <span>empty illustration</span>,
  AnimatedPlaceholderEmptySubTitle: 'div',
  AnimatedPlaceholderEmptyTextContainer: 'div',
  AnimatedPlaceholderEmptyTitle: 'div',
  SidePanelInformationBanner: ({ message }: { message: string }) => (
    <p>{message}</p>
  ),
}));

const refetch = jest.fn().mockResolvedValue({});
const setQueryState = (historyOverrides = {}, capabilityOverrides = {}) => {
  jest.mocked(useQuery).mockImplementation(
    (query) =>
      ({
        ...(query === COUPON_CAPABILITIES
          ? {
              data: {
                couponCapabilities: {
                  liveAvailable: false,
                  liveBlockedReason:
                    '관리자에게 센드비 연동 설정을 요청하세요.',
                  simulationBudget: 100000,
                  liveBudget: 50000,
                  products: [],
                  liveProducts: [],
                  ...capabilityOverrides,
                },
              },
              loading: false,
            }
          : {
              data: { couponDispatchHistory: [] },
              loading: false,
              refetch,
              ...historyOverrides,
            }),
      }) as unknown as ReturnType<typeof useQuery>,
  );
};
beforeEach(() => {
  refetch.mockClear();
  jest
    .mocked(useMutation)
    .mockReturnValue([jest.fn(), { loading: false }] as unknown as ReturnType<
      typeof useMutation
    >);
  setQueryState();
});
it('keeps simulation and setup notices visible together with the budget', () => {
  render(<CouponCampaignComposer />);
  expect(
    screen.getByText(/검증 모드 · 실제 전송 및 과금 없음/),
  ).toHaveTextContent('관리자에게 센드비 연동 설정을 요청하세요.');
  expect(screen.getByText('검증 예산 100,000원')).toBeInTheDocument();
  expect(screen.getByText('최대 1,000명')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /발송 전 검토/ })).toBeDisabled();
});
it('shows the shared empty state and refreshes history from its header', () => {
  render(<CouponCampaignComposer />);
  expect(screen.getByText('아직 발송 내역이 없습니다')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /새로고침/ }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
it('does not show empty history or allow duplicate refreshes while loading', () => {
  setQueryState({ loading: true });
  render(<CouponCampaignComposer />);
  const history = screen.getByRole('region', { name: '쿠폰 검증 이력' });
  expect(within(history).getByRole('status')).toHaveTextContent('불러오는 중');
  expect(screen.getByRole('button', { name: /새로고침/ })).toBeDisabled();
  expect(
    screen.queryByText('아직 발송 내역이 없습니다'),
  ).not.toBeInTheDocument();
});
it('shows an actionable error instead of empty history', () => {
  setQueryState({ error: new Error('unavailable') });
  render(<CouponCampaignComposer />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    '발송 내역을 불러오지 못했습니다',
  );
  expect(
    screen.queryByText('아직 발송 내역이 없습니다'),
  ).not.toBeInTheDocument();
});
it('retains the production payment notice and live budget when switching modes', () => {
  setQueryState({}, { liveAvailable: true, environment: 'production' });
  render(<CouponCampaignComposer />);
  fireEvent.click(screen.getByRole('button', { name: '실제 카카오 발송' }));
  expect(screen.getByText('실제 발송 · 센드비 캐시 차감')).toBeInTheDocument();
  expect(screen.getByText('발송 한도 50,000원')).toBeInTheDocument();
  expect(
    screen.queryByText(/검증 모드 · 실제 전송 및 과금 없음/),
  ).not.toBeInTheDocument();
});
