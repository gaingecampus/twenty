import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { RecordAvatarPicker } from '@/object-record/record-show/components/RecordAvatarPicker';
import { useIsRecordFieldReadOnly } from '@/object-record/read-only/hooks/useIsRecordFieldReadOnly';

const updateOneRecord = jest.fn();
const refetch = jest.fn().mockResolvedValue({});
jest.mock('@/object-metadata/hooks/useObjectMetadataItem', () => ({
  useObjectMetadataItem: () => ({
    objectMetadataItem: {
      id: 'company-metadata',
      fields: [
        { id: 'emoji-field', name: 'avatarEmoji' },
        { id: 'color-field', name: 'avatarColor' },
      ],
    },
  }),
}));
jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: () => ({ record: {}, loading: false, refetch }),
}));
jest.mock('@/object-record/hooks/useUpdateOneRecord', () => ({
  useUpdateOneRecord: () => ({ updateOneRecord }),
}));
jest.mock('@/object-record/read-only/hooks/useIsRecordFieldReadOnly', () => ({
  useIsRecordFieldReadOnly: jest.fn(),
}));
jest.mock('@/ui/layout/dropdown/components/Dropdown', () => ({
  Dropdown: ({
    clickableComponent,
    dropdownComponents,
  }: {
    clickableComponent: ReactNode;
    dropdownComponents: ReactNode;
  }) => (
    <>
      {clickableComponent}
      {dropdownComponents}
    </>
  ),
}));
jest.mock('@/ui/layout/dropdown/components/DropdownContent', () => ({
  DropdownContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  updateOneRecord.mockResolvedValue({});
  jest.mocked(useIsRecordFieldReadOnly).mockReturnValue(false);
});

it('persists company emoji to the company record, not a customer classification', async () => {
  render(
    <RecordAvatarPicker
      objectNameSingular="company"
      recordId="company"
      name="기업"
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '🏢 이모지' }));
  await waitFor(() => expect(refetch).toHaveBeenCalled());
  expect(updateOneRecord).toHaveBeenCalledWith(
    expect.objectContaining({
      objectNameSingular: 'company',
      idToUpdate: 'company',
      updateOneRecordInput: { avatarEmoji: '🏢' },
    }),
  );
});

it('resets saved customizations without changing the company domain', async () => {
  render(
    <RecordAvatarPicker
      objectNameSingular="company"
      recordId="company"
      name="기업"
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: /기본 아이콘으로 초기화/ }),
  );
  await waitFor(() => expect(refetch).toHaveBeenCalled());
  expect(updateOneRecord).toHaveBeenCalledWith(
    expect.objectContaining({
      updateOneRecordInput: { avatarEmoji: null, avatarColor: null },
    }),
  );
});

it('respects read-only field permissions', () => {
  jest.mocked(useIsRecordFieldReadOnly).mockReturnValue(true);
  render(
    <RecordAvatarPicker
      objectNameSingular="company"
      recordId="company"
      name="기업"
    />,
  );
  expect(
    screen.getByRole('button', { name: '프로필 이모지와 배경색 선택' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '🏢 이모지' }));
  expect(updateOneRecord).not.toHaveBeenCalled();
});

it('reports a failed save without pretending the choice was stored', async () => {
  updateOneRecord.mockRejectedValueOnce(new Error('unavailable'));
  render(
    <RecordAvatarPicker
      objectNameSingular="company"
      recordId="company"
      name="기업"
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '🏢 이모지' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    '저장하지 못했습니다',
  );
  expect(refetch).not.toHaveBeenCalled();
});
