jest.mock('@/object-record/record-store/hooks/useUpsertRecordsInStore', () => ({
  useUpsertRecordsInStore: () => ({ upsertRecordsInStore: jest.fn() }),
}));
jest.mock('@/object-metadata/hooks/useApolloCoreClient', () => ({
  useApolloCoreClient: () => ({ refetchQueries: jest.fn() }),
}));
import { SidePanelCampaignComposerPage } from '@/side-panel/pages/compose-campaign/components/SidePanelCampaignComposerPage';
import { type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/activities/emails/hooks/useSendMessageCampaign', () => ({
  useSendMessageCampaign: () => ({
    sendMessageCampaign: jest.fn(),
    loading: false,
  }),
}));
jest.mock('@/settings/accounts/hooks/useEmailSignature', () => ({
  useEmailSignature: () => ({ signature: '', loading: false }),
}));
jest.mock('@apollo/client/react', () => ({
  useMutation: () => [jest.fn(), { loading: false }],
}));
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({
    enqueueSuccessSnackBar: jest.fn(),
    enqueueErrorSnackBar: jest.fn(),
  }),
}));
jest.mock('@/side-panel/hooks/useSidePanelHistory', () => ({
  useSidePanelHistory: () => ({ goBackFromSidePanel: jest.fn() }),
}));
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue',
  () => ({
    useAtomComponentStateValue: () => null,
  }),
);
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => null,
}));
jest.mock('@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement', () => ({
  useHotkeysOnFocusedElement: jest.fn(),
}));
jest.mock('@/activities/emails/hooks/useUnsubscribeTopics', () => ({
  useUnsubscribeTopics: () => ({
    unsubscribeTopics: [{ id: 'topic', name: '소식' }],
  }),
}));
jest.mock('@/ui/input/components/internal/date/hooks/useUserTimezone', () => ({
  useUserTimezone: () => ({ userTimezone: 'Asia/Seoul' }),
}));
jest.mock('@/activities/emails/components/CampaignReviewModal', () => ({
  CampaignReviewModal: () => null,
}));
jest.mock(
  '@/activities/emails/components/EmailCampaignRecipientFields',
  () => ({
    EmailCampaignRecipientFields: () => <div>이메일 수신자</div>,
  }),
);
jest.mock('@/activities/emails/components/CampaignComposerFields', () => ({
  CampaignComposerFields: () => <div>이메일 작성</div>,
}));
jest.mock('@/activities/emails/components/SmsCampaignComposerContent', () => ({
  SmsCampaignComposerContent: ({
    isSendingBlocked,
    renderDispatchOptions,
  }: {
    isSendingBlocked: boolean;
    renderDispatchOptions: (fields: ReactNode) => ReactNode;
  }) => (
    <>
      {renderDispatchOptions(<div>문자 수신자</div>)}
      <button disabled={isSendingBlocked}>문자 검토</button>
    </>
  ),
}));
jest.mock(
  '@/activities/emails/components/coupon/CouponCampaignComposer',
  () => ({
    CouponCampaignComposer: ({
      isSendingDisabled,
      renderDispatchOptions,
    }: {
      isSendingDisabled: boolean;
      renderDispatchOptions: (fields: ReactNode) => ReactNode;
    }) => (
      <>
        {renderDispatchOptions(<div>쿠폰 수신자</div>)}
        <button disabled={isSendingDisabled}>선물 검토</button>
      </>
    ),
  }),
);
jest.mock(
  '@/object-record/record-field/ui/form-types/components/FormDateTimeFieldInput',
  () => ({
    FormDateTimeFieldInput: ({
      defaultValue,
      onChange,
    }: {
      defaultValue: string;
      onChange: (value: string) => void;
    }) => (
      <input
        aria-label="예약 시간"
        defaultValue={defaultValue}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  }),
);
jest.mock('@/ui/input/components/Select', () => ({
  Select: ({
    dropdownId,
    value,
    options,
    emptyOption,
    onChange,
  }: {
    dropdownId: string;
    value: string;
    options: { value: string; label: string }[];
    emptyOption?: { value: string; label: string };
    onChange: (value: string) => void;
  }) => (
    <select
      aria-label={dropdownId}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {[...(emptyOption ? [emptyOption] : []), ...options].map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

it('retains common timing, date and topic across all channels and blocks unsupported combinations', () => {
  render(<SidePanelCampaignComposerPage />);
  const timing = () =>
    screen.getByRole('combobox', { name: 'campaign-send-mode' });
  const topic = () =>
    screen.getByRole('combobox', {
      name: 'campaign-composer-unsubscribe-topic',
    });
  fireEvent.change(timing(), { target: { value: 'scheduled' } });
  fireEvent.change(screen.getByRole('textbox', { name: '예약 시간' }), {
    target: { value: '2026-12-01T10:00:00Z' },
  });
  fireEvent.change(topic(), { target: { value: 'topic' } });
  fireEvent.click(screen.getByRole('button', { name: '문자' }));
  expect(screen.getByRole('button', { name: '문자 검토' })).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent(
    '아직 예약 발송과 수신 거부 주제를 지원하지 않아',
  );
  fireEvent.click(screen.getByRole('button', { name: /카카오 쿠폰/ }));
  expect(screen.getByRole('button', { name: '선물 검토' })).toBeDisabled();
  expect(timing()).toHaveValue('scheduled');
  expect(topic()).toHaveValue('topic');
  expect(screen.getByRole('textbox', { name: '예약 시간' })).toHaveValue(
    '2026-12-01T10:00:00Z',
  );
  fireEvent.change(timing(), { target: { value: 'immediate' } });
  expect(screen.getByRole('button', { name: '선물 검토' })).toBeDisabled();
  fireEvent.change(topic(), { target: { value: '' } });
  expect(screen.getByRole('button', { name: '선물 검토' })).toBeEnabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.change(timing(), { target: { value: 'scheduled' } });
  expect(screen.getByRole('button', { name: '선물 검토' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '이메일' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText('이메일 작성')).toBeInTheDocument();
  expect(timing()).toHaveValue('scheduled');
  expect(screen.getByRole('textbox', { name: '예약 시간' })).toHaveValue(
    '2026-12-01T10:00:00Z',
  );
});

it.each([
  ['이메일', '이메일 수신자'],
  ['문자', '문자 수신자'],
  ['카카오 쿠폰', '쿠폰 수신자'],
])(
  'places %s recipients after the topic in common settings',
  (tab, recipient) => {
    render(<SidePanelCampaignComposerPage />);
    fireEvent.click(screen.getByText(tab));
    const settings = screen.getByLabelText('공통 발송 설정');
    const field = screen.getByText(recipient);
    expect(settings).toContainElement(field);
    expect(
      screen
        .getByRole('combobox', { name: 'campaign-composer-unsubscribe-topic' })
        .compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  },
);
