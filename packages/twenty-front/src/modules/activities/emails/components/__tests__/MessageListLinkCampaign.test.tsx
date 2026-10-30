import { MessageListLinkCampaign } from '@/activities/emails/components/message-lists/MessageListLinkCampaign';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { type ReactNode } from 'react';
import { i18n } from '@lingui/core';

jest.mock('@/object-metadata/hooks/useApolloCoreClient', () => ({
  useApolloCoreClient: jest.fn(),
}));
jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));
jest.mock('@/object-record/hooks/useObjectPermissionsForObject', () => ({
  useObjectPermissionsForObject: () => ({ canUpdateObjectRecords: true }),
}));
jest.mock('@/object-record/hooks/useUpdateManyRecordsMutation', () => ({
  useUpdateManyRecordsMutation: () => ({ updateManyRecordsMutation: 'update' }),
}));
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({ enqueueErrorSnackBar: jest.fn() }),
}));
jest.mock('@/ui/layout/modal/hooks/useModal', () => {
  const openModal = jest.fn();
  const closeModal = jest.fn();
  return { useModal: () => ({ openModal, closeModal }) };
});
jest.mock('@/ui/layout/modal/components/ModalStatefulWrapper', () => ({
  ModalStatefulWrapper: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
}));

const refetch = jest.fn().mockResolvedValue(undefined);
const mutate = jest.fn();
const onLinked = jest.fn().mockResolvedValue(undefined);
const recordsResult = {
  records: [],
  objectMetadataItem: { id: 'campaign', namePlural: 'messageCampaigns' },
  loading: false,
  error: undefined,
  hasNextPage: false,
  fetchMoreRecords: jest.fn(),
  refetch,
};

beforeEach(() => {
  i18n.load('en', {});
  i18n.activate('en');
  jest.clearAllMocks();
  jest
    .mocked(useApolloCoreClient)
    .mockReturnValue({ mutate } as unknown as ReturnType<
      typeof useApolloCoreClient
    >);
  jest
    .mocked(useFindManyRecords)
    .mockReturnValue(
      recordsResult as unknown as ReturnType<typeof useFindManyRecords>,
    );
});

it('keeps draft search in a dismissible modal and resets search when reopened', () => {
  render(<MessageListLinkCampaign listId="list" onLinked={onLinked} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(
    screen.queryByPlaceholderText('초안 제목 검색'),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^심방콜 발송 연결/ }));
  const dialog = screen.getByRole('dialog');
  expect(
    within(dialog).getByText('연결할 초안이 없습니다'),
  ).toBeInTheDocument();
  fireEvent.change(within(dialog).getByPlaceholderText('초안 제목 검색'), {
    target: { value: 'welcome' },
  });
  expect(within(dialog).getByText('검색 결과가 없습니다')).toBeInTheDocument();
  expect(useFindManyRecords).toHaveBeenLastCalledWith(
    expect.objectContaining({
      filter: {
        and: [
          { status: { eq: 'DRAFT' } },
          { listId: { is: 'NULL' } },
          { subject: { ilike: '%welcome%' } },
        ],
      },
      skip: false,
    }),
  );
  fireEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^심방콜 발송 연결/ }));
  expect(screen.getByPlaceholderText('초안 제목 검색')).toHaveValue('');
  fireEvent.keyDown(screen.getByPlaceholderText('초안 제목 검색'), {
    key: 'Escape',
  });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it.each([true, false])(
  'closes only when an unassigned draft was actually linked: %s',
  async (updated) => {
    jest.mocked(useFindManyRecords).mockReturnValue({
      ...recordsResult,
      records: [{ id: 'draft', subject: '초안 제목' }],
    } as unknown as ReturnType<typeof useFindManyRecords>);
    mutate.mockResolvedValue({
      data: { updateMessageCampaigns: updated ? [{ id: 'draft' }] : [] },
    });
    render(<MessageListLinkCampaign listId="list" onLinked={onLinked} />);
    fireEvent.click(screen.getByRole('button', { name: /^심방콜 발송 연결/ }));
    fireEvent.click(screen.getByRole('button', { name: '초안 제목 연결' }));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          filter: {
            and: [
              { id: { eq: 'draft' } },
              { status: { eq: 'DRAFT' } },
              { listId: { is: 'NULL' } },
            ],
          },
          data: { listId: 'list' },
        },
      }),
    );
    if (updated) {
      expect(onLinked).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } else {
      expect(onLinked).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    }
  },
);

it('shows a retry action instead of empty results when loading fails', () => {
  jest.mocked(useFindManyRecords).mockReturnValue({
    ...recordsResult,
    error: new Error('Unavailable'),
  } as unknown as ReturnType<typeof useFindManyRecords>);
  render(<MessageListLinkCampaign listId="list" onLinked={onLinked} />);
  fireEvent.click(screen.getByRole('button', { name: /^심방콜 발송 연결/ }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    '초안을 불러오지 못했습니다.',
  );
  expect(screen.queryByText('연결할 초안이 없습니다')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^다시 시도/ }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
