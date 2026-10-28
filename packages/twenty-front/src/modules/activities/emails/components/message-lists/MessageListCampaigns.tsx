import { MessageListHeaderCount } from '@/activities/emails/components/message-lists/MessageListHeaderCount';
import {
  StyledMessageListTable,
  StyledMessageListHeader,
  StyledMessageListCell,
} from '@/activities/emails/components/message-lists/MessageListTableStyles';
import { StyledMessageListEmpty } from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { MessageListLinkCampaign } from '@/activities/emails/components/message-lists/MessageListLinkCampaign';
import { DateTimeDisplay } from '@/ui/field/display/components/DateTimeDisplay';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { RecordPaginationBar } from '@/object-record/record-index/components/RecordIndexPaginationBar';
import { useState } from 'react';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { RecordChip } from '@/object-record/components/RecordChip';
import { EmailDisplay } from '@/ui/field/display/components/EmailDisplay';
import { Tag, type TagColor } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type Campaign = ObjectRecord & {
  subject: string | null;
  status: string;
  fromAddress: { primaryEmail: string } | null;
  scheduledAt: string | null;
  sentAt: string | null;
};
const StyledSection = styled.section`
  overflow: auto;
  width: 100%;
`;

const CAMPAIGN_GRID_COLUMNS =
  'minmax(160px, 1fr) minmax(180px, 1fr) 110px minmax(230px, 1fr)';

export const MessageListCampaigns = ({ listId }: { listId: string }) => (
  <MessageListCampaignsPage key={listId} listId={listId} />
);

const MessageListCampaignsPage = ({ listId }: { listId: string }) => {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { records, totalCount, loading, error, refetch } =
    useMessageListRecordPage<Campaign>({
      page,
      pageSize,
      objectNameSingular: 'messageCampaign',
      filter: { listId: { eq: listId } },
      recordGqlFields: {
        id: true,
        subject: true,
        status: true,
        fromAddress: true,
        scheduledAt: true,
        sentAt: true,
      },
    });
  const statusLabels: Record<string, string> = {
    DRAFT: t`초안`,
    SCHEDULED: t`예약됨`,
    SENDING: t`발송 중`,
    SENT: t`발송 완료`,
    CANCELLED: t`취소됨`,
    SENT_WITH_ERRORS: t`일부 발송 실패`,
    FAILED: t`실패`,
  };
  const statusColors: Record<string, TagColor> = {
    DRAFT: 'gray',
    SCHEDULED: 'blue',
    SENDING: 'yellow',
    SENT: 'green',
    CANCELLED: 'gray',
    SENT_WITH_ERRORS: 'orange',
    FAILED: 'red',
  };
  return (
    <StyledSection aria-label={t`연결된 심방콜 발송`}>
      <MessageListHeaderCount
        count={totalCount}
        loading={loading}
        error={Boolean(error)}
        label={t`연결된 단체 발송`}
      />
      <MessageListLinkCampaign
        listId={listId}
        onLinked={async () => {
          if (page !== 0) setPage(0);
          else await refetch();
        }}
      />
      {loading && <p>{t`불러오는 중…`}</p>}
      {error && <p role="alert">{t`심방콜 발송을 불러오지 못했습니다.`}</p>}
      {!loading && !error && records.length === 0 && (
        <StyledMessageListEmpty>
          {t`아직 연결된 심방콜 발송이 없습니다.`}
          <br />
          {t`심방콜 발송 연결 버튼으로 초안을 선택하세요.`}
        </StyledMessageListEmpty>
      )}
      {records.length > 0 && (
        <StyledMessageListTable>
          <TableRow gridTemplateColumns={CAMPAIGN_GRID_COLUMNS}>
            <StyledMessageListHeader>{t`심방콜 발송`}</StyledMessageListHeader>
            <StyledMessageListHeader>{t`발신자`}</StyledMessageListHeader>
            <StyledMessageListHeader>{t`상태`}</StyledMessageListHeader>
            <StyledMessageListHeader>{t`예약 / 발송 시각`}</StyledMessageListHeader>
          </TableRow>
          {records.map((campaign) => (
            <TableRow
              key={campaign.id}
              hoverBackgroundColor={
                themeCssVariables.background.transparent.light
              }
              gridTemplateColumns={CAMPAIGN_GRID_COLUMNS}
            >
              <StyledMessageListCell>
                <RecordChip
                  objectNameSingular="messageCampaign"
                  record={campaign}
                />
              </StyledMessageListCell>
              <StyledMessageListCell>
                <EmailDisplay value={campaign.fromAddress?.primaryEmail} />
              </StyledMessageListCell>
              <StyledMessageListCell>
                <Tag
                  text={statusLabels[campaign.status] ?? campaign.status}
                  color={statusColors[campaign.status] ?? 'gray'}
                />
              </StyledMessageListCell>
              <StyledMessageListCell>
                {campaign.sentAt || campaign.scheduledAt ? (
                  <DateTimeDisplay
                    value={campaign.sentAt ?? campaign.scheduledAt}
                  />
                ) : (
                  '—'
                )}
              </StyledMessageListCell>
            </TableRow>
          ))}
        </StyledMessageListTable>
      )}
      {!error && (
        <RecordPaginationBar
          currentPage={page + 1}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={(nextPage) => {
            if (!loading) setPage(nextPage - 1);
          }}
        />
      )}
    </StyledSection>
  );
};
