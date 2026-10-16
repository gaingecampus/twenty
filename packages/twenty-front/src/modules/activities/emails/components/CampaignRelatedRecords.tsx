import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { RecordChip } from '@/object-record/components/RecordChip';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { DateTimeDisplay } from '@/ui/field/display/components/DateTimeDisplay';
import { Button } from 'twenty-ui/input';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow: auto;
  padding: ${themeCssVariables.spacing[3]};
`;
const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  padding-bottom: ${themeCssVariables.spacing[2]};
`;

type Campaign = ObjectRecord & {
  list: (ObjectRecord & { name: string }) | null;
};
type DeliveryRecord = ObjectRecord & {
  displayName?: string;
  handle?: string;
  subject?: string;
  receivedAt?: string;
  deliveryStatus?: string;
};
const STATUS_LABELS: Record<string, string> = {
  SENDING: '발송 중',
  SENT: '발송 완료',
  DELIVERED: '전달 완료',
  FAILED: '발송 실패',
  BOUNCED: '반송',
  OPENED: '열람',
  CLICKED: '클릭',
  PENDING: '발송 대기',
  SKIPPED: '발송 제외',
};

export const CampaignRecipientList = ({
  campaignId,
}: {
  campaignId: string;
}) => {
  const { record, loading, error } = useFindOneRecord<Campaign>({
    objectNameSingular: 'messageCampaign',
    objectRecordId: campaignId,
    recordGqlFields: { id: true, list: { id: true, name: true } },
  });
  return (
    <StyledSection aria-label="연결된 동반 고객 목록">
      {loading ? (
        '불러오는 중…'
      ) : error ? (
        <p role="alert">동반 고객 목록을 불러오지 못했습니다.</p>
      ) : record?.list ? (
        <RecordChip objectNameSingular="messageList" record={record.list} />
      ) : (
        '연결된 동반 고객 목록이 없습니다.'
      )}
    </StyledSection>
  );
};

export const CampaignRelatedRecords = ({
  campaignId,
  kind,
}: {
  campaignId: string;
  kind: 'recipients' | 'messages';
}) => {
  const isRecipients = kind === 'recipients';
  const { records, loading, error, hasNextPage, fetchMoreRecords } =
    useFindManyRecords<DeliveryRecord>({
      objectNameSingular: isRecipients ? 'messageParticipant' : 'message',
      filter: { messageCampaignId: { eq: campaignId } },
      recordGqlFields: isRecipients
        ? { id: true, displayName: true, handle: true }
        : { id: true, subject: true, receivedAt: true, deliveryStatus: true },
      limit: 20,
    });
  return (
    <StyledSection aria-label={isRecipients ? '발송 수신자' : '발송 내역'}>
      {loading && <p>불러오는 중…</p>}
      {error && (
        <p role="alert">목록을 불러오지 못했습니다. 새로고침해 주세요.</p>
      )}
      {!loading && !error && records.length === 0 && (
        <p>
          {isRecipients ? '발송된 수신자가 없습니다.' : '발송 내역이 없습니다.'}
        </p>
      )}
      {records.map((record) => (
        <StyledRow key={record.id}>
          {isRecipients ? (
            <>
              <span>{record.displayName || '이름 없음'}</span>
              <span>{record.handle}</span>
            </>
          ) : (
            <>
              <RecordChip objectNameSingular="message" record={record} />
              <span>
                {STATUS_LABELS[record.deliveryStatus ?? ''] ??
                  record.deliveryStatus}
              </span>
              {record.receivedAt && (
                <DateTimeDisplay value={record.receivedAt} />
              )}
            </>
          )}
        </StyledRow>
      ))}
      {hasNextPage && (
        <Button
          title="더 보기"
          disabled={loading}
          onClick={() => void fetchMoreRecords()}
        />
      )}
    </StyledSection>
  );
};
