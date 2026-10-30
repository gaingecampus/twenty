import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
import { TextEncoder } from 'node:util';

const originalTextEncoder = Object.getOwnPropertyDescriptor(
  globalThis,
  'TextEncoder',
);
beforeAll(() => {
  Object.defineProperty(globalThis, 'TextEncoder', {
    configurable: true,
    value: TextEncoder,
  });
});
afterAll(() => {
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
  const refetch = jest.fn();
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
  jest
    .mocked(useQuery)
    .mockReturnValue({ refetch } as unknown as ReturnType<typeof useQuery>);
  render(<SmsCampaignComposer isSendingDisabled />);
  fireEvent.click(screen.getByRole('button', { name: '고객 목록 선택' }));
  fireEvent.change(screen.getByRole('textbox', { name: '문자 내용' }), {
    target: { value: '안녕하세요' },
  });
  const contentInput = screen.getByRole('textbox', {
    name: '문자 내용',
  }) as HTMLTextAreaElement;
  contentInput.setSelectionRange(0, 0);
  fireEvent.click(screen.getByRole('button', { name: 'fullName' }));
  expect(contentInput).toHaveValue('{{fullName}}안녕하세요');
  contentInput.setSelectionRange(12, 17);
  fireEvent.click(screen.getByRole('button', { name: 'companyName' }));
  expect(contentInput).toHaveValue('{{fullName}}{{companyName}}');
  expect(
    screen.queryByRole('button', { name: 'email' }),
  ).not.toBeInTheDocument();
  const reviewButton = screen.getByRole('button', { name: /발송 전 검토/ });
  const refreshButton = screen.getByRole('button', {
    name: /접수 내역 새로고침/,
  });
  expect(reviewButton).toBeDisabled();
  expect(refreshButton).toBeDisabled();
  fireEvent.click(reviewButton);
  fireEvent.click(refreshButton);
  expect(loadPreview).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
  expect(refetch).not.toHaveBeenCalled();
  expect(useQuery).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ skip: true }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    '문자 발송 설정이 완료되지 않아 전송할 수 없습니다.',
  );
});
