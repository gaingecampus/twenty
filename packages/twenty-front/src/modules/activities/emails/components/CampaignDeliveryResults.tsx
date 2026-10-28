import { useState } from 'react';
import { styled } from '@linaria/react';
import { Tag, type TagColor } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessageListHeaderCount } from '@/activities/emails/components/message-lists/MessageListHeaderCount';
import {
  StyledMessageListTable,
  StyledMessageListHeader,
  StyledMessageListCell,
} from '@/activities/emails/components/message-lists/MessageListTableStyles';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { RecordChip } from '@/object-record/components/RecordChip';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { RecordPaginationBar } from '@/object-record/record-index/components/RecordIndexPaginationBar';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { DateTimeDisplay } from '@/ui/field/display/components/DateTimeDisplay';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};

  p {
    margin: 0;
  }
`;
const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;
const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;
const StyledEmpty = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[3]};
  text-align: center;
`;
const StyledSubtitle = styled(AnimatedPlaceholderEmptySubTitle)`
  && {
    max-height: none;
    max-width: 420px;
    overflow: visible;
    width: 100%;
    word-break: keep-all;
  }
`;
const StyledScroll = styled.div`
  overflow-x: auto;
`;
const StyledRecipient = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[0.5]};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const COLUMNS = 'minmax(210px, 1fr) 115px minmax(160px, 1fr) 180px';
const STATUS: Record<string, { label: string; color: TagColor }> = {
  QUEUED: { label: '발송 대기', color: 'gray' },
  PENDING: { label: '발송 대기', color: 'gray' },
  SENDING: { label: '발송 중', color: 'yellow' },
  SENT: { label: '발송 완료', color: 'green' },
  DELIVERED: { label: '전달 완료', color: 'green' },
  FAILED: { label: '발송 실패', color: 'red' },
  BOUNCED: { label: '반송', color: 'red' },
  COMPLAINED: { label: '스팸 신고', color: 'red' },
  SKIPPED: { label: '발송 제외', color: 'gray' },
};
type Delivery = ObjectRecord & {
  subject?: string;
  createdAt?: string;
  deliveryStatus?: string;
  messageParticipants?: {
    id: string;
    role: string;
    displayName?: string;
    handle?: string;
  }[];
};

export const CampaignDeliveryResults = ({
  campaignId,
}: {
  campaignId: string;
}) => {
  const [page, setPage] = useState(0);
  const { records, totalCount, loading, error, refetch, canReadObjectRecords } =
    useMessageListRecordPage<Delivery>({
      page,
      pageSize: 20,
      objectNameSingular: 'message',
      filter: { messageCampaignId: { eq: campaignId } },
      recordGqlFields: {
        id: true,
        subject: true,
        createdAt: true,
        deliveryStatus: true,
        messageParticipants: {
          id: true,
          role: true,
          displayName: true,
          handle: true,
        },
      },
    });
  const campaign = useFindOneRecord<ObjectRecord & { status?: string }>({
    objectNameSingular: 'messageCampaign',
    objectRecordId: campaignId,
    recordGqlFields: { id: true, status: true },
  });
  const scheduled = campaign.record?.status === 'SCHEDULED';
  const draft = campaign.record?.status === 'DRAFT';
  const emptyTitle = scheduled
    ? '예약 발송을 기다리고 있어요'
    : draft
      ? '아직 발송하지 않았어요'
      : '아직 발송 처리 기록이 없어요';
  const emptyDescription = scheduled
    ? '예약 시각에 발송 처리가 시작되면 수신자별 결과가 여기에 표시됩니다.'
    : draft
      ? '발송을 시작하면 수신자별 대기·성공·실패 결과가 여기에 표시됩니다.'
      : '발송 처리가 시작되면 기록이 표시됩니다. 발송 상태와 예약 시각은 홈에서 확인하세요.';
  return (
    <StyledSection aria-label="수신자별 발송 결과" aria-busy={loading}>
      <MessageListHeaderCount
        count={totalCount}
        loading={loading}
        error={Boolean(error) || !canReadObjectRecords}
        label="발송 처리 기록"
      />
      <StyledToolbar>
        <StyledHint>
          수신자별 처리 결과와 발송 메시지를 함께 확인하세요.
        </StyledHint>
        <Button
          title="새로고침"
          disabled={loading || !canReadObjectRecords}
          onClick={() => {
            void refetch().catch(() => undefined);
          }}
        />
      </StyledToolbar>
      {!canReadObjectRecords ? (
        <p role="alert">발송 결과를 조회할 권한이 없습니다.</p>
      ) : error ? (
        <p role="alert">발송 결과를 불러오지 못했습니다. 새로고침해 주세요.</p>
      ) : loading ? (
        <p role="status">발송 결과를 불러오는 중…</p>
      ) : records.length === 0 ? (
        <StyledEmpty role="status">
          <AnimatedPlaceholder type="emptyInbox" />
          <AnimatedPlaceholderEmptyTextContainer>
            <AnimatedPlaceholderEmptyTitle>
              {emptyTitle}
            </AnimatedPlaceholderEmptyTitle>
            <StyledSubtitle>{emptyDescription}</StyledSubtitle>
          </AnimatedPlaceholderEmptyTextContainer>
        </StyledEmpty>
      ) : (
        <>
          <StyledScroll role="region" aria-label="발송 결과 표" tabIndex={0}>
            <StyledMessageListTable>
              <TableRow gridTemplateColumns={COLUMNS}>
                {['수신자', '처리 상태', '메시지', '기록 시각'].map((title) => (
                  <StyledMessageListHeader key={title}>
                    {title}
                  </StyledMessageListHeader>
                ))}
              </TableRow>
              {records.map((record) => {
                const recipients =
                  record.messageParticipants?.filter(
                    (participant) =>
                      participant.role === 'to' || participant.role === 'TO',
                  ) ?? [];
                const status = STATUS[record.deliveryStatus ?? ''] ?? {
                  label: '상태 확인 필요',
                  color: 'gray' as const,
                };
                return (
                  <TableRow key={record.id} gridTemplateColumns={COLUMNS}>
                    <StyledMessageListCell>
                      {recipients.length
                        ? recipients.map((recipient) => (
                            <StyledRecipient
                              key={recipient.id}
                              title={recipient.handle}
                            >
                              {recipient.displayName &&
                                recipient.displayName !== recipient.handle && (
                                  <span>{recipient.displayName}</span>
                                )}
                              <span>
                                {recipient.handle || '주소 정보 없음'}
                              </span>
                            </StyledRecipient>
                          ))
                        : '수신자 정보 없음'}
                    </StyledMessageListCell>
                    <StyledMessageListCell>
                      <Tag text={status.label} color={status.color} />
                    </StyledMessageListCell>
                    <StyledMessageListCell>
                      <RecordChip
                        objectNameSingular="message"
                        record={record}
                      />
                    </StyledMessageListCell>
                    <StyledMessageListCell>
                      {record.createdAt ? (
                        <DateTimeDisplay value={record.createdAt} />
                      ) : (
                        '—'
                      )}
                    </StyledMessageListCell>
                  </TableRow>
                );
              })}
            </StyledMessageListTable>
          </StyledScroll>
          <RecordPaginationBar
            currentPage={page + 1}
            pageSize={20}
            totalCount={totalCount}
            onPageChange={(nextPage) => {
              if (!loading) setPage(nextPage - 1);
            }}
          />
        </>
      )}
    </StyledSection>
  );
};
