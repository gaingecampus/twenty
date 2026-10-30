import { buildCampaignDraft } from '@/activities/emails/utils/buildCampaignDraft';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
import { TextEncoder } from 'node:util';
import { type ReactNode } from 'react';

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

const originalTextEncoder = Object.getOwnPropertyDescriptor(
  globalThis,
  'TextEncoder',
);
const originalPointerEvent = Object.getOwnPropertyDescriptor(
  window,
  'PointerEvent',
);
beforeAll(() => {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    value: MouseEvent,
  });
  Object.defineProperty(globalThis, 'TextEncoder', {
    configurable: true,
    value: TextEncoder,
  });
});
afterAll(() => {
  if (originalPointerEvent)
    Object.defineProperty(window, 'PointerEvent', originalPointerEvent);
  else Reflect.deleteProperty(window, 'PointerEvent');
  if (originalTextEncoder)
    Object.defineProperty(globalThis, 'TextEncoder', originalTextEncoder);
  else Reflect.deleteProperty(globalThis, 'TextEncoder');
});

jest.mock('@/activities/emails/components/CampaignBodyVariablePicker', () => ({
  CampaignBodyVariablePicker: ({
    onInsert,
    variables,
  }: {
    onInsert: (text: string) => void;
    variables: string[];
  }) => (
    <div>
      {variables.map((variable) => (
        <button key={variable} onClick={() => onInsert(`{{${variable}}}`)}>
          {variable}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: jest.fn(),
}));
let headerElement: HTMLElement;
beforeEach(() => {
  jest.clearAllMocks();
  headerElement = document.createElement('header');
  document.body.appendChild(headerElement);
  jest.mocked(useAtomStateValue).mockReturnValue(headerElement);
});
afterEach(() => {
  cleanup();
  headerElement.remove();
});

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
jest.mock('@apollo/client/react', () => ({
  useLazyQuery: jest.fn(),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock(
  '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker',
  () => ({
    FormSingleRecordPicker: ({
      onChange,
    }: {
      onChange: (value: string) => void;
    }) => <button onClick={() => onChange('list')}>고객 목록 선택</button>,
  }),
);

it('allows composing but never queries SMS history, reviews recipients, or sends while SMS is unavailable', () => {
  const loadPreview = jest.fn();
  const send = jest.fn();
  jest
    .mocked(useLazyQuery)
    .mockReturnValue([loadPreview, { loading: false }] as unknown as ReturnType<
      typeof useLazyQuery
    >);
  jest
    .mocked(useMutation)
    .mockReturnValue([send, { loading: false }] as unknown as ReturnType<
      typeof useMutation
    >);
  render(<SmsCampaignComposer isSendingDisabled />);
  fireEvent.click(screen.getByRole('button', { name: '고객 목록 선택' }));
  fireEvent.change(screen.getByRole('textbox', { name: '메시지' }), {
    target: { value: '안녕하세요' },
  });
  const contentInput = screen.getByRole('textbox', {
    name: '메시지',
  }) as HTMLTextAreaElement;
  contentInput.setSelectionRange(0, 0);
  fireEvent.click(screen.getByRole('button', { name: 'fullName' }));
  expect(contentInput).toHaveValue('{{fullName}}안녕하세요');
  contentInput.setSelectionRange(12, 17);
  fireEvent.click(screen.getByRole('button', { name: 'companyName' }));
  expect(contentInput).toHaveValue('{{fullName}}{{companyName}}');
  fireEvent.click(
    screen.getByRole('button', { name: '메시지 전체 화면으로 열기' }),
  );
  const fullScreenInput = within(screen.getByRole('dialog')).getByRole(
    'textbox',
    {
      name: '메시지',
    },
  );
  expect(fullScreenInput).toHaveValue('{{fullName}}{{companyName}}');
  fireEvent.change(fullScreenInput, {
    target: { value: '전체 화면에서 작성' },
  });
  fireEvent.click(screen.getByRole('button', { name: '편집기 닫기' }));
  expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue(
    '전체 화면에서 작성',
  );
  expect(
    screen.queryByRole('button', { name: 'email' }),
  ).not.toBeInTheDocument();
  const reviewButton = within(headerElement).getByRole('button', {
    name: /발송 전 검토/,
  });
  expect(reviewButton).toBeDisabled();
  fireEvent.click(reviewButton);
  expect(loadPreview).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
  expect(useQuery).not.toHaveBeenCalled();
  expect(screen.queryByText('최근 발송 내역')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /접수 내역 새로고침/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(
    '문자 발송 설정이 완료되지 않아 전송할 수 없습니다.',
  );
});

it('reviews from the header only after required fields are filled without sending', async () => {
  const loadPreview = jest.fn().mockResolvedValue({
    data: {
      previewSmsDispatch: {
        total: 1,
        missing: 0,
        duplicates: 0,
        sms: 1,
        lms: 0,
        sample: '안녕하세요',
      },
    },
  });
  const send = jest.fn();
  jest
    .mocked(useLazyQuery)
    .mockReturnValue([loadPreview, { loading: false }] as unknown as ReturnType<
      typeof useLazyQuery
    >);
  jest
    .mocked(useMutation)
    .mockReturnValue([send, { loading: false }] as unknown as ReturnType<
      typeof useMutation
    >);
  const { container, rerender } = render(<SmsCampaignComposer />);
  const reviewButton = within(headerElement).getByRole('button', {
    name: /발송 전 검토/,
  });
  expect(reviewButton).toBeDisabled();
  expect(
    within(container).queryByRole('button', { name: /발송 전 검토/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '고객 목록 선택' }));
  fireEvent.change(screen.getByRole('textbox', { name: '메시지' }), {
    target: { value: '안녕하세요' },
  });
  expect(reviewButton).toBeEnabled();
  const advertisingCheckbox = screen.getByRole('checkbox', {
    name: '광고 문자',
  });
  fireEvent.click(advertisingCheckbox);
  expect(advertisingCheckbox).toBeChecked();
  expect(advertisingCheckbox).toHaveAccessibleDescription(
    '(광고)로 시작하고 발신자 이름 및 등록된 무료수신거부 080 번호를 메시지에 넣어주세요.',
  );
  fireEvent.click(reviewButton);
  await waitFor(() =>
    expect(
      screen.getByRole('region', { name: '문자 발송 확인' }),
    ).toBeInTheDocument(),
  );
  expect(loadPreview).toHaveBeenCalledWith({
    variables: {
      input: {
        listId: 'list',
        subject: '',
        content: '안녕하세요',
        advertising: true,
      },
    },
  });
  rerender(<SmsCampaignComposer isSendingBlocked />);
  expect(reviewButton).toBeDisabled();
  const sendButton = screen.getByRole('button', { name: /1명에게 문자 발송/ });
  expect(sendButton).toBeDisabled();
  fireEvent.click(sendButton);
  expect(send).not.toHaveBeenCalled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  rerender(<SmsCampaignComposer />);
  expect(reviewButton).toBeEnabled();
  expect(sendButton).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: '휴대폰번호 직접 입력' }));
  fireEvent.change(screen.getByRole('textbox', { name: '수신자 휴대폰번호' }), {
    target: { value: '01012345678' },
  });
  expect(reviewButton).toBeDisabled();
  expect(
    screen.queryByRole('region', { name: '문자 발송 확인' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(
    '직접 입력 발송은 아직 지원하지 않습니다.',
  );
  fireEvent.click(reviewButton);
  expect(loadPreview).toHaveBeenCalledTimes(1);
  expect(send).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '고객 분류' }));
  expect(reviewButton).toBeEnabled();
  expect(
    screen.queryByRole('region', { name: '문자 발송 확인' }),
  ).not.toBeInTheDocument();
  expect(useQuery).not.toHaveBeenCalled();
});

it('restores and saves an unfinished SMS even when sending is unavailable', () => {
  const saveDraft = jest.fn();
  render(
    <SmsCampaignComposer
      isSendingDisabled
      initialDraft={buildCampaignDraft({
        channel: 'sms',
        recipientMode: 'direct',
        directRecipient: '01012',
        subject: '작성 중',
        body: '문자 초안',
        advertising: true,
      })}
      saveDraft={saveDraft}
    />,
  );
  expect(screen.getByRole('textbox', { name: '제목 (선택)' })).toHaveValue(
    '작성 중',
  );
  expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue(
    '문자 초안',
  );
  fireEvent.click(screen.getByRole('button', { name: /임시 저장/ }));
  expect(saveDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      recipientMode: 'direct',
      directRecipient: '01012',
      body: '문자 초안',
      advertising: true,
    }),
  );
  expect(screen.getByRole('button', { name: /발송 전 검토/ })).toBeDisabled();
});
