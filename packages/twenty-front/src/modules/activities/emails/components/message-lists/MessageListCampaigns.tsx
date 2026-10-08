import { StyledMessageListEmpty } from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { MessageListLinkCampaign } from '@/activities/emails/components/message-lists/MessageListLinkCampaign';
import { DateTimeDisplay } from '@/ui/field/display/components/DateTimeDisplay';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { Table } from '@/ui/layout/table/components/Table';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableCell } from '@/ui/layout/table/components/TableCell';
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

const StyledCampaignIdentity = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  overflow: hidden;
`;

const StyledSender = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CAMPAIGN_GRID_COLUMNS = 'minmax(160px, 1fr) 110px minmax(160px, 1fr)';

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
    <StyledSection aria-label={t`연결된 캠페인`}>
      <MessageListLinkCampaign listId={listId} onLinked={refetch} />
      {loading && <p>{t`불러오는 중…`}</p>}
      {error && <p role="alert">{t`캠페인을 불러오지 못했습니다.`}</p>}
      {!loading && !error && records.length === 0 && (
        <StyledMessageListEmpty>
          {t`아직 연결된 캠페인이 없습니다.`}
          <br />
          {t`캠페인 연결 버튼으로 초안을 선택하세요.`}
        </StyledMessageListEmpty>
      )}
      {records.length > 0 && (
        <Table>
          <TableRow gridTemplateColumns={CAMPAIGN_GRID_COLUMNS}>
            <TableHeader>{t`캠페인 / 발신자`}</TableHeader>
            <TableHeader>{t`상태`}</TableHeader>
            <TableHeader>{t`예약 / 발송 시각`}</TableHeader>
          </TableRow>
          {records.map((campaign) => (
            <TableRow
              key={campaign.id}
              gridTemplateColumns={CAMPAIGN_GRID_COLUMNS}
            >
              <TableCell minWidth="0" height={themeCssVariables.spacing[14]}>
                <StyledCampaignIdentity>
                  <RecordChip
                    objectNameSingular="messageCampaign"
                    record={campaign}
                  />
                  <StyledSender>
                    <EmailDisplay value={campaign.fromAddress?.primaryEmail} />
                  </StyledSender>
                </StyledCampaignIdentity>
              </TableCell>
              <TableCell minWidth="0" height={themeCssVariables.spacing[14]}>
                <Tag
                  text={statusLabels[campaign.status] ?? campaign.status}
                  color={statusColors[campaign.status] ?? 'gray'}
                />
              </TableCell>
              <TableCell minWidth="0" height={themeCssVariables.spacing[14]}>
                {campaign.sentAt || campaign.scheduledAt ? (
                  <DateTimeDisplay
                    value={campaign.sentAt ?? campaign.scheduledAt}
                  />
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
      {hasNextPage && (
        <Button
          title={t`캠페인 더 보기`}
          onClick={() => fetchMoreRecords()}
          disabled={loading}
        />
      )}
    </StyledSection>
  );
};
