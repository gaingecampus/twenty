import { fireEvent, render, screen } from '@testing-library/react';
import { MessageListAddCustomersModal } from '@/activities/emails/components/message-lists/MessageListAddCustomersModal';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { type SelectableItem } from '@/object-record/select/types/SelectableItem';

jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));
jest.mock('@/activities/emails/hooks/useMessageListRecordPage', () => ({
  useMessageListRecordPage: jest.fn(),
}));
jest.mock('@/object-record/hooks/useCreateManyRecords', () => ({
  useCreateManyRecords: () => ({ createManyRecords: jest.fn() }),
}));
jest.mock('@/object-record/hooks/useObjectPermissionsForObject', () => ({
  useObjectPermissionsForObject: () => ({ canUpdateObjectRecords: true }),
}));
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({
    enqueueSuccessSnackBar: jest.fn(),
    enqueueErrorSnackBar: jest.fn(),
  }),
}));
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => ({ id: 'self' }),
}));
jest.mock('@/ui/layout/modal/hooks/useModal', () => ({
  useModal: () => ({ openModal: jest.fn(), closeModal: jest.fn() }),
}));
jest.mock('@/ui/layout/modal/components/ModalStatefulWrapper', () => ({
  ModalStatefulWrapper: () => null,
}));
jest.mock('@/ui/layout/dropdown/components/DropdownMenuSearchInput', () => ({
  DropdownMenuSearchInput: () => <input aria-label="검색" />,
}));
jest.mock('@/object-record/select/components/MultipleSelectDropdown', () => ({
  MultipleSelectDropdown: ({
    itemsToSelect,
    filteredSelectedItems,
    onChange,
  }: {
    itemsToSelect: SelectableItem[];
    filteredSelectedItems: SelectableItem[];
    onChange: (item: SelectableItem, selected: boolean) => void;
  }) => (
    <>
      {[...filteredSelectedItems, ...itemsToSelect].map((item) => (
        <div key={item.id}>
          <input
            type="checkbox"
            aria-label={item.name}
            checked={item.isSelected}
            onChange={() => onChange(item, !item.isSelected)}
          />
          <span>{item.description}</span>
        </div>
      ))}
    </>
  ),
}));

const recipients = [
  {
    id: 'registered',
    name: { firstName: '기존', lastName: '수신자' },
    emails: { primaryEmail: 'existing@example.com' },
    userEmail: 'existing@example.com',
    company: { id: 'company', name: '가인지컨설팅그룹' },
  },
  {
    id: 'new',
    name: { firstName: '신규', lastName: '수신자' },
    emails: { primaryEmail: 'new@example.com' },
    userEmail: 'new@example.com',
  },
];

it.each(['person', 'workspaceMember'] as const)(
  'checks existing %s recipients on open and only counts newly selected recipients for addition',
  (recipientType) => {
    const recipientIdField =
      recipientType === 'person' ? 'personId' : 'workspaceMemberId';
    jest.mocked(useMessageListRecordPage).mockReturnValue({
      records: recipients,
      totalCount: 2,
      loading: false,
    } as unknown as ReturnType<typeof useMessageListRecordPage>);
    jest
      .mocked(useFindManyRecords)
      .mockImplementation(({ objectNameSingular, filter, skip }) => {
        const ids =
          (filter as { and?: Record<string, { in?: string[] }>[] })?.and?.find(
            (clause) => clause[recipientIdField] !== undefined,
          )?.[recipientIdField]?.in ?? [];
        return {
          records:
            objectNameSingular === 'messageListMember' &&
            !skip &&
            ids.includes('registered')
              ? [{ id: 'membership', [recipientIdField]: 'registered' }]
              : [],
          objectMetadataItem: { id: 'members' },
          loading: false,
          hasNextPage: false,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useFindManyRecords>;
      });

    render(
      <MessageListAddCustomersModal
        initialListId="list"
        recipientType={recipientType}
        dropdownId="picker"
        onClose={jest.fn()}
      />,
    );
    const registered = screen.getByRole('checkbox', { name: /기존 수신자/ });
    const newRecipient = screen.getByRole('checkbox', { name: /신규 수신자/ });
    expect(registered).toBeChecked();
    expect(registered.getAttribute('aria-label')).toBe(
      recipientType === 'person'
        ? '기존 수신자 · 가인지컨설팅그룹'
        : '기존 수신자',
    );
    expect(screen.getByText('existing@example.com')).toBeInTheDocument();
    expect(newRecipient).not.toBeChecked();
    expect(screen.getByText('선택한 수신자 0명 추가')).toBeInTheDocument();

    fireEvent.click(registered);
    expect(registered).toBeChecked();
    fireEvent.click(newRecipient);
    expect(newRecipient).toBeChecked();
    expect(screen.getByText('선택한 수신자 1명 추가')).toBeInTheDocument();
    fireEvent.click(newRecipient);
    expect(newRecipient).not.toBeChecked();
    expect(registered).toBeChecked();
    expect(screen.getByText('선택한 수신자 0명 추가')).toBeInTheDocument();
  },
);
