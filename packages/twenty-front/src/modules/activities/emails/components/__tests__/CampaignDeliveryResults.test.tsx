import { fireEvent, render, screen, within } from '@testing-library/react';
import { CampaignDeliveryResults } from '@/activities/emails/components/CampaignDeliveryResults';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { WidgetHeaderActionContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderActionContext';
jest.mock('@/activities/emails/hooks/useMessageListRecordPage', () => ({
  useMessageListRecordPage: jest.fn(),
}));
jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: jest.fn(),
}));
jest.mock('@/object-record/components/RecordChip', () => ({
  RecordChip: ({ record }: { record: { subject: string } }) => (
    <span>{record.subject}</span>
  ),
}));
jest.mock('@/ui/field/display/components/DateTimeDisplay', () => ({
  DateTimeDisplay: ({ value }: { value: string }) => <span>{value}</span>,
}));
jest.mock('twenty-ui/feedback', () => ({
  AnimatedPlaceholder: () => <span>empty illustration</span>,
  AnimatedPlaceholderEmptySubTitle: 'div',
  AnimatedPlaceholderEmptyTextContainer: 'div',
  AnimatedPlaceholderEmptyTitle: 'div',
}));
const refetch = jest.fn().mockResolvedValue({});
const setPage = (overrides = {}) =>
  jest.mocked(useMessageListRecordPage).mockReturnValue({
    records: [],
    totalCount: 0,
    loading: false,
    error: undefined,
    canReadObjectRecords: true,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useMessageListRecordPage>);
beforeEach(() => {
  setPage();
  jest.mocked(useFindOneRecord).mockReturnValue({
    record: { status: 'SCHEDULED' },
  } as unknown as ReturnType<typeof useFindOneRecord>);
});
it('explains scheduled empty results and offers a safe refresh', () => {
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByText('예약 발송을 기다리고 있어요')).toBeInTheDocument();
  expect(screen.queryByText('발송 실패')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /새로고침/ }));
  expect(refetch).toHaveBeenCalled();
});
it('places refresh in the widget header when an action slot is available', () => {
  const header = document.createElement('div');
  const { unmount } = render(
    <WidgetHeaderActionContext.Provider value={header}>
      <CampaignDeliveryResults campaignId="campaign" />
    </WidgetHeaderActionContext.Provider>,
  );
  fireEvent.click(within(header).getByRole('button', { name: /새로고침/ }));
  expect(refetch).toHaveBeenCalled();
  expect(
    screen.queryByRole('button', { name: /새로고침/ }),
  ).not.toBeInTheDocument();
  unmount();
  expect(header).toBeEmptyDOMElement();
});
it('does not show an empty success state while loading', () => {
  setPage({ loading: true });
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByText('발송 결과를 불러오는 중…')).toBeInTheDocument();
  expect(
    screen.queryByText('예약 발송을 기다리고 있어요'),
  ).not.toBeInTheDocument();
});
it('distinguishes request errors from no deliveries', () => {
  setPage({ error: new Error('unavailable') });
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했습니다');
  expect(
    screen.queryByText('예약 발송을 기다리고 있어요'),
  ).not.toBeInTheDocument();
});
it('does not present denied access as zero deliveries', () => {
  setPage({ canReadObjectRecords: false });
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByRole('alert')).toHaveTextContent('권한이 없습니다');
  expect(
    screen.queryByText('예약 발송을 기다리고 있어요'),
  ).not.toBeInTheDocument();
});
it('shows recipient and message status together without including the sender', () => {
  setPage({
    totalCount: 1,
    records: [
      {
        id: 'message',
        subject: '안내 메일',
        deliveryStatus: 'QUEUED',
        createdAt: '2026-10-28T00:00:00Z',
        messageParticipants: [
          { id: 'from', role: 'from', handle: 'sender@example.com' },
          {
            id: 'to',
            role: 'to',
            displayName: '고객',
            handle: 'recipient@example.com',
          },
        ],
      },
    ],
  });
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByText('recipient@example.com')).toBeInTheDocument();
  expect(screen.getByText('발송 대기')).toBeInTheDocument();
  expect(screen.getByText('안내 메일')).toBeInTheDocument();
  expect(screen.queryByText('sender@example.com')).not.toBeInTheDocument();
});
