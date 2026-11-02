import { type ReactNode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { CampaignDeliveryResults } from '@/activities/emails/components/CampaignDeliveryResults';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useSmsCampaignDeliveryPage } from '@/activities/emails/hooks/useSmsCampaignDeliveryPage';
import { WidgetHeaderActionContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderActionContext';
jest.mock('@/activities/emails/hooks/useMessageListRecordPage', () => ({
  useMessageListRecordPage: jest.fn(),
}));
jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: jest.fn(),
}));
jest.mock('@/activities/emails/hooks/useSmsCampaignDeliveryPage', () => ({
  useSmsCampaignDeliveryPage: jest.fn(),
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
  Loader: () => <span data-testid="delivery-loader" />,
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
  jest.clearAllMocks();
  setPage();
  jest.mocked(useSmsCampaignDeliveryPage).mockReturnValue({
    records: [],
    totalCount: 0,
    loading: false,
    error: undefined,
    refetch,
  });
  jest.mocked(useFindOneRecord).mockReturnValue({
    record: { status: 'SCHEDULED' },
    refetch,
  } as unknown as ReturnType<typeof useFindOneRecord>);
});
it('loads SMS snapshots rather than email messages and distinguishes acceptance from delivery', () => {
  jest.mocked(useFindOneRecord).mockReturnValue({
    record: { status: 'SENT', channel: 'SMS' },
    refetch,
  } as unknown as ReturnType<typeof useFindOneRecord>);
  jest.mocked(useSmsCampaignDeliveryPage).mockReturnValue({
    records: [
      {
        id: 'sms:0:0',
        name: '문자 수신자',
        phone: '01012345678',
        status: 'ACCEPTED',
        messageType: 'LMS',
        createdAt: '2026-11-02T00:00:00Z',
      },
    ],
    totalCount: 1,
    loading: false,
    error: undefined,
    refetch,
  });
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(useMessageListRecordPage).toHaveBeenCalledWith(
    expect.objectContaining({ skip: true }),
  );
  expect(useSmsCampaignDeliveryPage).toHaveBeenCalledWith({
    campaignId: 'campaign',
    page: 0,
    skip: false,
  });
  expect(screen.getByText('문자 수신자')).toBeInTheDocument();
  expect(screen.getByText('01012345678')).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: '01012345678' }),
  ).not.toBeInTheDocument();
  expect(screen.getByText('LMS')).toBeInTheDocument();
  expect(screen.getByText('문자 서버 접수')).toBeInTheDocument();
  expect(screen.queryByText('전달 완료')).not.toBeInTheDocument();
});

it('does not show an empty email result while campaign type is still loading', () => {
  jest
    .mocked(useFindOneRecord)
    .mockReturnValue({ loading: true, refetch } as unknown as ReturnType<
      typeof useFindOneRecord
    >);
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByText('발송 내역을 불러오는 중…')).toBeInTheDocument();
  expect(useMessageListRecordPage).toHaveBeenCalledWith(
    expect.objectContaining({ skip: true }),
  );
});

it('shows SMS errors without presenting an empty success state', () => {
  jest.mocked(useFindOneRecord).mockReturnValue({
    record: { channel: 'SMS' },
    refetch,
  } as unknown as ReturnType<typeof useFindOneRecord>);
  jest.mocked(useSmsCampaignDeliveryPage).mockReturnValue({
    records: [],
    totalCount: 0,
    loading: false,
    error: new Error('Forbidden'),
    refetch,
  });
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했습니다');
  expect(
    screen.queryByText('아직 발송 처리 기록이 없어요'),
  ).not.toBeInTheDocument();
});
it('explains scheduled empty results and offers a safe refresh', async () => {
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByText('예약 발송을 기다리고 있어요')).toBeInTheDocument();
  expect(screen.queryByText('발송 실패')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /새로고침/ }));
  expect(refetch).toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.queryByTestId('delivery-loader')).not.toBeInTheDocument(),
  );
});
it('places refresh in the widget header when an action slot is available', async () => {
  const header = document.createElement('div');
  const { unmount } = render(
    <WidgetHeaderActionContext.Provider value={header}>
      <CampaignDeliveryResults campaignId="campaign" />
    </WidgetHeaderActionContext.Provider>,
  );
  fireEvent.click(within(header).getByRole('button', { name: /새로고침/ }));
  expect(refetch).toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.queryByTestId('delivery-loader')).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole('button', { name: /새로고침/ }),
  ).not.toBeInTheDocument();
  unmount();
  expect(header).toBeEmptyDOMElement();
});
it.each(['EMAIL', 'SMS'])(
  'keeps %s refresh busy until both requests settle, including failures',
  async (channel) => {
    let finishCampaign!: () => void;
    let failDeliveries!: (error: Error) => void;
    const campaignRefetch = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishCampaign = resolve;
        }),
    );
    const deliveryRefetch = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          failDeliveries = reject;
        }),
    );
    jest.mocked(useFindOneRecord).mockReturnValue({
      record: { channel },
      refetch: campaignRefetch,
    } as unknown as ReturnType<typeof useFindOneRecord>);
    setPage({ refetch: deliveryRefetch });
    jest.mocked(useSmsCampaignDeliveryPage).mockReturnValue({
      records: [],
      totalCount: 0,
      loading: false,
      error: undefined,
      refetch: deliveryRefetch,
    } as unknown as ReturnType<typeof useSmsCampaignDeliveryPage>);
    render(<CampaignDeliveryResults campaignId="campaign" />);
    fireEvent.click(screen.getByRole('button', { name: /새로고침/ }));
    expect(screen.getByTestId('delivery-loader')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /불러오는 중/ })).toBeDisabled();
    expect(screen.getByRole('region', { name: '발송 내역' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await act(async () => {
      failDeliveries(new Error('network'));
    });
    expect(screen.getByTestId('delivery-loader')).toBeInTheDocument();
    await act(async () => {
      finishCampaign();
    });
    expect(screen.queryByTestId('delivery-loader')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /새로고침/ })).toBeEnabled();
  },
);
it('does not show an empty success state while loading', () => {
  setPage({ loading: true });
  render(<CampaignDeliveryResults campaignId="campaign" />);
  expect(screen.getByText('발송 내역을 불러오는 중…')).toBeInTheDocument();
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

jest.mock(
  '@/object-record/record-table/components/RecordTableScrollbars',
  () => ({
    RecordTableScrollbars: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);
