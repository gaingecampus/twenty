import { WidgetHeaderActionContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderActionContext';
import { WidgetHeaderTitleContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderTitleContext';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MessageListMembers } from '@/activities/emails/components/message-lists/MessageListMembers';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';

jest.mock('@/activities/emails/hooks/useMessageListRecordPage', () => ({
  useMessageListRecordPage: jest.fn(),
}));
jest.mock('@/object-record/hooks/useDeleteOneRecord', () => ({
  useDeleteOneRecord: jest.fn(),
}));
jest.mock('@/ui/input/components/Select', () => ({
  Select: ({
    options,
    onChange,
  }: {
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }) => (
    <div>
      {options.map((option) => (
        <button key={option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));
jest.mock('@/object-record/hooks/useObjectPermissionsForObject', () => ({
  useObjectPermissionsForObject: () => ({
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: true,
  }),
}));
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({ enqueueErrorSnackBar: jest.fn() }),
}));
jest.mock('@/object-record/components/RecordChip', () => ({
  RecordChip: ({ record }: { record: { id: string } }) => (
    <span>{record.id}</span>
  ),
}));
jest.mock('@/ui/field/display/components/EmailDisplay', () => ({
  EmailDisplay: ({ value }: { value: string }) => <span>{value}</span>,
}));
jest.mock(
  '@/activities/emails/components/message-lists/MessageListAddCustomersModal',
  () => ({ MessageListAddCustomersModal: () => null }),
);
jest.mock(
  '@/object-record/record-index/components/RecordIndexPaginationBar',
  () => ({
    RecordPaginationBar: ({
      currentPage,
      onPageChange,
    }: {
      currentPage: number;
      onPageChange: (page: number) => void;
    }) => (
      <div>
        <span>page {currentPage}</span>
        <button onClick={() => onPageChange(20)}>last page</button>
      </div>
    ),
  }),
);

it('keeps a 1000-person list at 50 rendered rows and resets when changing lists', () => {
  jest
    .mocked(useDeleteOneRecord)
    .mockReturnValue({ deleteOneRecord: jest.fn() } as unknown as ReturnType<
      typeof useDeleteOneRecord
    >);
  jest.mocked(useMessageListRecordPage).mockImplementation(
    ({ page, pageSize }) =>
      ({
        records: Array.from({ length: pageSize }, (_, index) => ({
          id: `member-${page * pageSize + index}`,
          __typename: 'MessageListMember',
          person: {
            id: `person-${page * pageSize + index}`,
            emails: { primaryEmail: 'example@example.com' },
          },
        })),
        totalCount: 1000,
        loading: false,
        error: undefined,
        objectMetadataItem: { id: 'member' },
        refetch: jest.fn(),
      }) as unknown as ReturnType<typeof useMessageListRecordPage>,
  );
  const { rerender } = render(<MessageListMembers listId="first" />);
  expect(screen.getAllByRole('button', { name: /^제외/ })).toHaveLength(50);
  expect(screen.getByText('person-0')).toBeInTheDocument();
  fireEvent.click(screen.getByText('last page'));
  expect(screen.getByText('person-950')).toBeInTheDocument();
  expect(screen.queryByText('person-0')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /^제외/ })).toHaveLength(50);
  rerender(<MessageListMembers listId="second" />);
  expect(screen.getByText('page 1')).toBeInTheDocument();
});

it('returns to the preceding page after excluding its last recipient', async () => {
  const deleteOneRecord = jest.fn().mockResolvedValue(undefined);
  jest
    .mocked(useDeleteOneRecord)
    .mockReturnValue({ deleteOneRecord } as unknown as ReturnType<
      typeof useDeleteOneRecord
    >);
  jest.mocked(useMessageListRecordPage).mockImplementation(
    () =>
      ({
        records: [
          { id: 'member', __typename: 'MessageListMember', person: null },
        ],
        totalCount: 951,
        loading: false,
        error: undefined,
        objectMetadataItem: { id: 'member' },
        refetch: jest.fn(),
      }) as unknown as ReturnType<typeof useMessageListRecordPage>,
  );
  render(<MessageListMembers listId="first" />);
  fireEvent.click(screen.getByText('last page'));
  fireEvent.click(screen.getByRole('button', { name: /^제외/ }));
  await waitFor(() => expect(screen.getByText('page 19')).toBeInTheDocument());
  expect(deleteOneRecord).toHaveBeenCalledWith('member');
});

it('places the full recipient count and add actions in the widget header without duplicating them in the body', () => {
  const titleTarget = document.createElement('span');
  const actionTarget = document.createElement('div');
  jest.mocked(useMessageListRecordPage).mockReturnValue({
    records: [],
    totalCount: 1000,
    loading: false,
    error: undefined,
    objectMetadataItem: { id: 'member' },
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useMessageListRecordPage>);
  const { container } = render(
    <WidgetHeaderTitleContext.Provider value={titleTarget}>
      <WidgetHeaderActionContext.Provider value={actionTarget}>
        <MessageListMembers listId="header-list" />
      </WidgetHeaderActionContext.Provider>
    </WidgetHeaderTitleContext.Provider>,
  );
  expect(within(titleTarget).getByText('1,000')).toBeTruthy();
  expect(
    within(actionTarget).getByRole('button', { name: /^고객 추가/ }),
  ).toBeTruthy();
  expect(
    within(actionTarget).getByRole('button', {
      name: /^워크스페이스 멤버 추가/,
    }),
  ).toBeTruthy();
  expect(
    within(container).queryByRole('button', { name: /^고객 추가/ }),
  ).toBeNull();
  expect(within(container).queryByText('1,000')).toBeNull();
  expect(
    within(actionTarget).queryByRole('button', { name: '전체' }),
  ).toBeNull();
  expect(
    within(container).getByRole('button', { name: '전체' }),
  ).toBeInTheDocument();
});

it('shows whole-list email counts and resets pagination when filtering', () => {
  jest
    .mocked(useMessageListRecordPage)
    .mockImplementation(({ filter, pageSize }) => {
      const isFiltered = Boolean(filter && 'and' in filter);
      return {
        records:
          pageSize === 50
            ? [
                {
                  id: 'member',
                  person: {
                    id: 'person',
                    emails: { primaryEmail: 'person@example.com' },
                  },
                },
              ]
            : [],
        totalCount: isFiltered ? 820 : 1000,
        loading: false,
        error: undefined,
        objectMetadataItem: { id: 'member' },
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useMessageListRecordPage>;
    });
  render(<MessageListMembers listId="email-list" />);
  expect(screen.getByRole('status')).toHaveTextContent('이메일 등록 820명');
  expect(
    screen.getByRole('button', { name: '이메일 없음 180명' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByText('last page'));
  fireEvent.click(screen.getByRole('button', { name: '이메일 있음 820명' }));
  expect(screen.getByText('page 1')).toBeInTheDocument();
  expect(useMessageListRecordPage).toHaveBeenCalledWith(
    expect.objectContaining({
      page: 0,
      pageSize: 50,
      filter: {
        and: [
          { listId: { eq: 'email-list' } },
          {
            not: {
              and: [
                {
                  or: [
                    { person: { emails: { primaryEmail: { is: 'NULL' } } } },
                    { person: { emails: { primaryEmail: { eq: '' } } } },
                  ],
                },
                {
                  or: [
                    { workspaceMember: { userEmail: { is: 'NULL' } } },
                    { workspaceMember: { userEmail: { eq: '' } } },
                  ],
                },
              ],
            },
          },
        ],
      },
    }),
  );
});

it('keeps filtering available for empty results and does not show failed counts as zero', () => {
  jest.mocked(useMessageListRecordPage).mockImplementation(
    ({ pageSize }) =>
      ({
        records: [],
        totalCount: 0,
        loading: false,
        error: pageSize === 1 ? new Error('Count unavailable') : undefined,
        objectMetadataItem: { id: 'member' },
        refetch: jest.fn(),
      }) as unknown as ReturnType<typeof useMessageListRecordPage>,
  );
  render(<MessageListMembers listId="empty-list" />);
  expect(screen.getByRole('status')).toHaveTextContent('이메일 등록 —명');
  fireEvent.click(screen.getByRole('button', { name: '이메일 없음 —명' }));
  expect(
    screen.getByText('선택한 이메일 조건에 해당하는 수신자가 없습니다.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('고객 또는 워크스페이스 멤버를 추가하세요.'),
  ).not.toBeInTheDocument();
});

it.each([false, true])(
  'refreshes recipients after excluding one even if count refresh fails: %s',
  async (countRefreshFails) => {
    const refetchCounts = countRefreshFails
      ? jest.fn().mockRejectedValue(new Error('Count unavailable'))
      : jest.fn().mockResolvedValue(undefined);
    const refetchPage = jest.fn().mockResolvedValue(undefined);
    jest.mocked(useDeleteOneRecord).mockReturnValue({
      deleteOneRecord: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useDeleteOneRecord>);
    jest.mocked(useMessageListRecordPage).mockImplementation(
      ({ pageSize }) =>
        ({
          records: pageSize === 50 ? [{ id: 'member', person: null }] : [],
          totalCount: 1,
          loading: false,
          error: undefined,
          objectMetadataItem: { id: 'member' },
          refetch: pageSize === 1 ? refetchCounts : refetchPage,
        }) as unknown as ReturnType<typeof useMessageListRecordPage>,
    );
    render(<MessageListMembers listId="removal-list" />);
    fireEvent.click(screen.getByRole('button', { name: /^제외/ }));
    await waitFor(() => expect(refetchPage).toHaveBeenCalled());
    expect(refetchCounts).toHaveBeenCalledTimes(2);
  },
);
