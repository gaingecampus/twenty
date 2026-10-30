import { type ReactElement, type ReactNode } from 'react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { buildCampaignDraft } from '@/activities/emails/utils/buildCampaignDraft';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  cleanup,
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CouponCampaignComposer } from '@/activities/emails/components/coupon/CouponCampaignComposer';
import { COUPON_CAPABILITIES } from '@/activities/emails/components/coupon/coupon-operations';

const render = (component: ReactElement) =>
  renderComponent(component, {
    wrapper: ({ children }) => (
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    ),
  });

jest.mock('@/ui/layout/fullscreen/hooks/useFullScreenModal', () => ({
  useFullScreenModal: ({ onClose }: { onClose: () => void }) => ({
    renderFullScreenModal: (children: ReactNode, isOpen: boolean) =>
      isOpen ? (
        <div role="dialog">
          <button onClick={onClose}>편집기 닫기</button>
          {children}
        </div>
      ) : null,
  }),
}));

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
  render(<CouponCampaignComposer isAdminTesting />);
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
  render(<CouponCampaignComposer isAdminTesting />);
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
  const { rerender } = render(
    <CouponCampaignComposer isAdminTesting isSendingDisabled />,
  );
  expect(screen.getByRole('button', { name: '고객 분류' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: '휴대폰번호 직접 입력' }));
  fireEvent.change(screen.getByRole('textbox', { name: '수신자 휴대폰번호' }), {
    target: { value: '01012345678' },
  });
  fireEvent.click(screen.getByRole('button', { name: /커피/ }));
  const review = screen.getByRole('button', {
    name: /발송 전 검토/,
  });
  expect(screen.getAllByRole('button', { name: /발송 전 검토/ })).toHaveLength(
    1,
  );
  expect(review).toBeDisabled();
  fireEvent.click(review);
  expect(mutate).not.toHaveBeenCalled();
  rerender(<CouponCampaignComposer isAdminTesting />);
  expect(review).toBeEnabled();
  fireEvent.click(review);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /외부 전송 없이 검증 실행/ }),
    ).toBeEnabled(),
  );
  rerender(<CouponCampaignComposer isAdminTesting isSendingDisabled />);
  const confirm = screen.getByRole('button', {
    name: /외부 전송 없이 검증 실행/,
  });
  expect(confirm).toBeDisabled();
  fireEvent.click(confirm);
  expect(mutate).toHaveBeenCalledTimes(1);
});

it('restores coupon inputs and permits saving without a product or recipient', () => {
  const saveDraft = jest.fn();
  render(
    <CouponCampaignComposer
      isAdminTesting
      initialDraft={buildCampaignDraft({
        channel: 'coupon',
        body: '쿠폰 초안',
        subject: '작성 중',
        couponMode: 'SIMULATION',
        scenario: 'UNKNOWN',
      })}
      saveDraft={saveDraft}
    />,
  );
  expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue(
    '쿠폰 초안',
  );
  fireEvent.click(screen.getByRole('button', { name: /임시 저장/ }));
  expect(saveDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      body: '쿠폰 초안',
      subject: '작성 중',
      productId: '',
      listId: null,
      scenario: 'UNKNOWN',
    }),
  );
  expect(screen.getByRole('button', { name: /발송 전 검토/ })).toBeDisabled();
});

it('preserves coupon edits and its limit when opening and closing the full screen editor', () => {
  render(<CouponCampaignComposer isAdminTesting />);
  expect(screen.getByRole('textbox', { name: '메시지' })).toHaveAttribute(
    'maxlength',
    '500',
  );
  fireEvent.click(
    screen.getByRole('button', { name: '메시지 전체 화면으로 열기' }),
  );
  const input = within(screen.getByRole('dialog')).getByRole('textbox', {
    name: '메시지',
  });
  fireEvent.change(input, { target: { value: '쿠폰 메시지 수정' } });
  expect(input).toHaveAttribute('maxlength', '500');
  fireEvent.click(screen.getByRole('button', { name: '편집기 닫기' }));
  expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue(
    '쿠폰 메시지 수정',
  );
  expect(screen.getByText('9 / 500자')).toBeInTheDocument();
});

it('inserts customer information at the selection in both editors and saves the template', () => {
  const saveDraft = jest.fn();
  render(<CouponCampaignComposer saveDraft={saveDraft} />);
  const input = screen.getByRole<HTMLTextAreaElement>('textbox', {
    name: '메시지',
  });
  fireEvent.change(input, { target: { value: '고객님 감사합니다' } });
  input.setSelectionRange(0, 2);
  fireEvent.click(screen.getByRole('button', { name: '고객 이름' }));
  expect(input).toHaveValue('{{fullName}}님 감사합니다');
  fireEvent.click(
    screen.getByRole('button', { name: '메시지 전체 화면으로 열기' }),
  );
  const expandedInput = within(
    screen.getByRole('dialog'),
  ).getByRole<HTMLTextAreaElement>('textbox', { name: '메시지' });
  expandedInput.setSelectionRange(0, 0);
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '기업' }),
  );
  fireEvent.click(screen.getByRole('button', { name: '편집기 닫기' }));
  fireEvent.click(screen.getByRole('button', { name: /임시 저장/ }));
  expect(saveDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      body: '{{companyName}}{{fullName}}님 감사합니다',
    }),
  );
});

it('does not exceed the coupon message limit when inserting customer information', () => {
  render(<CouponCampaignComposer />);
  const input = screen.getByRole<HTMLTextAreaElement>('textbox', {
    name: '메시지',
  });
  fireEvent.change(input, { target: { value: '가'.repeat(500) } });
  input.setSelectionRange(500, 500);
  fireEvent.click(screen.getByRole('button', { name: '고객 이름' }));
  expect(input).toHaveValue('가'.repeat(500));
  input.setSelectionRange(0, 12);
  fireEvent.click(screen.getByRole('button', { name: '고객 이름' }));
  expect(input).toHaveValue('{{fullName}}' + '가'.repeat(488));
});

it('hides internal testing controls and blocks review until production dispatch is ready', () => {
  render(<CouponCampaignComposer />);
  expect(
    screen.getByText('카카오 쿠폰 발송 준비 중입니다.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: '발송 모드' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: '검증 상황' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/검증 예산/)).not.toBeInTheDocument();
  expect(screen.queryByText('테스트 상품')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /발송 전 검토/ })).toBeDisabled();
});

it('shows production products without a test mode selector in the normal composer', () => {
  setQueryState({
    liveAvailable: true,
    environment: 'production',
    liveProducts: [
      { id: 'live-coffee', name: '운영 커피', price: 5000, validityDays: 30 },
    ],
  });
  render(<CouponCampaignComposer />);
  expect(
    screen.getByRole('button', { name: '운영 커피 · 5,000원' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('카카오 쿠폰 발송 준비 중입니다.'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: '발송 모드' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/검증 예산/)).not.toBeInTheDocument();
});
