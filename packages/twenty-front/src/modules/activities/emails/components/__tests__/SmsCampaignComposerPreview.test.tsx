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

it('allows composing but never queries SMS history, reviews recipients, or sends in preview mode', () => {
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
  render(<SmsCampaignComposer isPreview />);
  fireEvent.click(screen.getByRole('button', { name: '고객 목록 선택' }));
  fireEvent.change(screen.getByRole('textbox', { name: '문자 내용' }), {
    target: { value: '안녕하세요' },
  });
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
  expect(screen.getByRole('status')).toHaveTextContent(
    '실제 문자는 발송되지 않습니다',
  );
});
