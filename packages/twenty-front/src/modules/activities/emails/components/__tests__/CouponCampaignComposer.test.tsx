import { useMutation, useQuery } from '@apollo/client/react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CouponCampaignComposer } from '@/activities/emails/components/coupon/CouponCampaignComposer';
import { COUPON_CAPABILITIES } from '@/activities/emails/components/coupon/coupon-operations';

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: jest.fn(),
}));
let headerElement: HTMLElement;

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
const setQueryState = (capabilityOverrides = {}) => {
  jest.mocked(useQuery).mockReturnValue({
    data: {
      couponCapabilities: {
        liveAvailable: false,
        liveBlockedReason: '관리자에게 센드비 연동 설정을 요청하세요.',
        simulationBudget: 100000,
        liveBudget: 50000,
        products: [],
        liveProducts: [],
        ...capabilityOverrides,
      },
    },
    loading: false,
  } as unknown as ReturnType<typeof useQuery>);
};
beforeEach(() => {
  jest.clearAllMocks();
  headerElement = document.createElement('header');
  document.body.appendChild(headerElement);
  jest.mocked(useAtomStateValue).mockReturnValue(headerElement);
  jest
    .mocked(useMutation)
    .mockReturnValue([jest.fn(), { loading: false }] as unknown as ReturnType<
      typeof useMutation
    >);
  setQueryState();
});
afterEach(() => {
  cleanup();
  headerElement.remove();
});
it('keeps simulation and setup notices visible together with the budget', () => {
  render(<CouponCampaignComposer />);
  expect(
    screen.getByText(/검증 모드 · 실제 전송 및 과금 없음/),
  ).toHaveTextContent('관리자에게 센드비 연동 설정을 요청하세요.');
  expect(screen.getByText('검증 예산 100,000원')).toBeInTheDocument();
  expect(screen.getByText('최대 1,000명')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /발송 전 검토/ })).toBeDisabled();
  expect(
    screen.queryByRole('region', { name: '쿠폰 검증 이력' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /새로고침/ }),
  ).not.toBeInTheDocument();
  expect(useQuery).toHaveBeenCalledTimes(1);
  expect(useQuery).toHaveBeenCalledWith(COUPON_CAPABILITIES);
});
it('retains the production payment notice and live budget when switching modes', () => {
  setQueryState({ liveAvailable: true, environment: 'production' });
  render(<CouponCampaignComposer />);
  fireEvent.click(screen.getByRole('button', { name: '실제 카카오 발송' }));
  expect(screen.getByText('실제 발송 · 센드비 캐시 차감')).toBeInTheDocument();
  expect(screen.getByText('발송 한도 50,000원')).toBeInTheDocument();
  expect(
    screen.queryByText(/검증 모드 · 실제 전송 및 과금 없음/),
  ).not.toBeInTheDocument();
});

it('blocks review and an existing confirmation when common options are unsupported', async () => {
  const product = { id: 'coffee', name: '커피', price: 5000, validityDays: 30 };
  setQueryState({ products: [product] });
  const mutate = jest.fn().mockResolvedValue({
    data: {
      previewCouponDispatch: {
        id: 'quote',
        mode: 'SIMULATION',
        product,
        recipientCount: 1,
        missing: 0,
        duplicates: 0,
        estimatedCost: 5000,
        message: '감사합니다',
        expiresAt: '2026-10-30T10:00:00Z',
      },
    },
  });
  jest
    .mocked(useMutation)
    .mockReturnValue([mutate, { loading: false }] as unknown as ReturnType<
      typeof useMutation
    >);
  const { rerender } = render(<CouponCampaignComposer isSendingDisabled />);
  fireEvent.change(screen.getByRole('textbox', { name: '수신자 폰번호' }), {
    target: { value: '01012345678' },
  });
  fireEvent.click(screen.getByRole('button', { name: /커피/ }));
  const review = within(headerElement).getByRole('button', {
    name: /발송 전 검토/,
  });
  expect(screen.getAllByRole('button', { name: /발송 전 검토/ })).toHaveLength(
    1,
  );
  expect(review).toBeDisabled();
  fireEvent.click(review);
  expect(mutate).not.toHaveBeenCalled();
  rerender(<CouponCampaignComposer />);
  expect(review).toBeEnabled();
  fireEvent.click(review);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /외부 전송 없이 검증 실행/ }),
    ).toBeEnabled(),
  );
  rerender(<CouponCampaignComposer isSendingDisabled />);
  const confirm = screen.getByRole('button', {
    name: /외부 전송 없이 검증 실행/,
  });
  expect(confirm).toBeDisabled();
  fireEvent.click(confirm);
  expect(mutate).toHaveBeenCalledTimes(1);
});
