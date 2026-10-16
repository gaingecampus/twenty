import { StyledMessageListEmpty } from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { MessageListLinkCampaign } from '@/activities/emails/components/message-lists/MessageListLinkCampaign';
import { DateTimeDisplay } from '@/ui/field/display/components/DateTimeDisplay';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { Table } from '@/ui/layout/table/components/Table';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { RECORD_TABLE_ROW_HEIGHT } from '@/object-record/record-table/constants/RecordTableRowHeight';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { RecordChip } from '@/object-record/components/RecordChip';
import { EmailDisplay } from '@/ui/field/display/components/EmailDisplay';
import { Tag, type TagColor } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';

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

const StyledCampaignTable = styled(Table)`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  min-width: 700px;
  overflow: hidden;

  > [data-table-row] {
    border-radius: 0;
  }

  > [data-table-row]:not(:last-child) {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
  }

  > [data-table-row] > :not(:last-child) {
    border-right: 1px solid ${themeCssVariables.border.color.light};
  }

  > [data-table-row]:has([data-table-header])
    + [data-table-row]:not(:has([data-table-header])),
  > [data-table-row]:last-child:not(:has([data-table-header])) {
    margin: 0;
  }
`;

const StyledCampaignHeader = styled(TableHeader)`
  border-bottom: none;
  box-sizing: border-box;
  height: ${RECORD_TABLE_ROW_HEIGHT}px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledCampaignCell = styled(TableCell)`
  box-sizing: border-box;
  height: ${RECORD_TABLE_ROW_HEIGHT}px;
  min-width: 0;
  overflow: hidden;
  padding: 0 ${themeCssVariables.spacing[3]};
  white-space: nowrap;
`;

const CAMPAIGN_GRID_COLUMNS =
  'minmax(160px, 1fr) minmax(180px, 1fr) 110px minmax(230px, 1fr)';

export const MessageListCampaigns = ({ listId }: { listId: string }) => {
  const { records, loading, error, hasNextPage, fetchMoreRecords, refetch } =
    useFindManyRecords<Campaign>({
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
      limit: 20,
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
      <MessageListLinkCampaign listId={listId} onLinked={refetch} />
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
        <StyledCampaignTable>
          <TableRow gridTemplateColumns={CAMPAIGN_GRID_COLUMNS}>
            <StyledCampaignHeader>{t`심방콜 발송`}</StyledCampaignHeader>
            <StyledCampaignHeader>{t`발신자`}</StyledCampaignHeader>
            <StyledCampaignHeader>{t`상태`}</StyledCampaignHeader>
            <StyledCampaignHeader>{t`예약 / 발송 시각`}</StyledCampaignHeader>
          </TableRow>
          {records.map((campaign) => (
            <TableRow
              key={campaign.id}
              hoverBackgroundColor={
                themeCssVariables.background.transparent.light
              }
              gridTemplateColumns={CAMPAIGN_GRID_COLUMNS}
            >
              <StyledCampaignCell>
                <RecordChip
                  objectNameSingular="messageCampaign"
                  record={campaign}
                />
              </StyledCampaignCell>
              <StyledCampaignCell>
                <EmailDisplay value={campaign.fromAddress?.primaryEmail} />
              </StyledCampaignCell>
              <StyledCampaignCell>
                <Tag
                  text={statusLabels[campaign.status] ?? campaign.status}
                  color={statusColors[campaign.status] ?? 'gray'}
                />
              </StyledCampaignCell>
              <StyledCampaignCell>
                {campaign.sentAt || campaign.scheduledAt ? (
                  <DateTimeDisplay
                    value={campaign.sentAt ?? campaign.scheduledAt}
                  />
                ) : (
                  '—'
                )}
              </StyledCampaignCell>
            </TableRow>
          ))}
        </StyledCampaignTable>
      )}
      {hasNextPage && (
        <Button
          title={t`심방콜 발송 더 보기`}
          onClick={() => fetchMoreRecords()}
          disabled={loading}
        />
      )}
    </StyledSection>
  );
};
