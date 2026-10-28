import { MessageListHeaderCount } from '@/activities/emails/components/message-lists/MessageListHeaderCount';
import { WidgetHeaderActionContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderActionContext';
import { createPortal } from 'react-dom';
import {
  StyledMessageListTable,
  StyledMessageListHeader,
  StyledMessageListCell,
} from '@/activities/emails/components/message-lists/MessageListTableStyles';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { StyledMessageListEmpty } from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { RecordChip } from '@/object-record/components/RecordChip';
import { EmailDisplay } from '@/ui/field/display/components/EmailDisplay';
import { MessageListAddCustomersModal } from '@/activities/emails/components/message-lists/MessageListAddCustomersModal';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { RecordPaginationBar } from '@/object-record/record-index/components/RecordIndexPaginationBar';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';
type MessageListMember = ObjectRecord & {
  personId: string;
  workspaceMember:
    | (ObjectRecord & {
        name: { firstName: string; lastName: string };
        userEmail: string;
      })
    | null;
  person:
    | (ObjectRecord & {
        name: { firstName: string; lastName: string };
        emails: { primaryEmail: string };
        jobTitle?: string;
        company?: { id: string; name: string } | null;
      })
    | null;
};

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  width: 100%;
`;
const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledTableScroll = styled.div`
  min-width: 0;
  overflow-x: auto;
`;
const StyledMetadata = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
`;
const StyledRecipientNotice = styled.span`
  font-size: ${themeCssVariables.font.size.sm};
  white-space: normal;
`;
const MEMBER_GRID_COLUMNS =
  'minmax(180px, 1fr) minmax(150px, 1fr) minmax(280px, 1.5fr) 80px';

export const MessageListMembers = ({ listId }: { listId: string }) => (
  <MessageListMembersPage key={listId} listId={listId} />
);

const MessageListMembersPage = ({ listId }: { listId: string }) => {
  const headerActionTarget = useContext(WidgetHeaderActionContext);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [busy, setBusy] = useState(false);
  const { enqueueErrorSnackBar } = useSnackBar();
  const { records, totalCount, loading, error, refetch, objectMetadataItem } =
    useMessageListRecordPage<MessageListMember>({
      page,
      pageSize,
      objectNameSingular: 'messageListMember',
      filter: { listId: { eq: listId } },
      recordGqlFields: {
        id: true,
        personId: true,
        person: {
          id: true,
          name: true,
          emails: true,
          jobTitle: true,
          company: { id: true, name: true },
        },
        workspaceMember: { id: true, name: true, userEmail: true },
      },
    });
  const permissions = useObjectPermissionsForObject(objectMetadataItem.id);
  const [adding, setAdding] = useState<'person' | 'workspaceMember' | null>(
    null,
  );
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'messageListMember',
  });
  const runMutation = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      if (page > 0 && records.length === 1) setPage(page - 1);
      else await refetch();
    } catch {
      enqueueErrorSnackBar({
        message: t`고객 분류를 변경하지 못했습니다. 다시 시도하세요.`,
      });
    } finally {
      setBusy(false);
    }
  };
  const actions = (
    <StyledActions>
      {permissions.canUpdateObjectRecords && (
        <Button
          title={t`고객 추가`}
          size="small"
          variant="primary"
          accent="blue"
          disabled={busy}
          onClick={() => setAdding('person')}
        />
      )}
      {permissions.canUpdateObjectRecords && (
        <Button
          title={t`워크스페이스 멤버 추가`}
          size="small"
          disabled={busy}
          onClick={() => setAdding('workspaceMember')}
        />
      )}
    </StyledActions>
  );
  return (
    <StyledSection>
      <MessageListHeaderCount
        count={totalCount}
        loading={loading}
        error={Boolean(error)}
        label={t`등록된 수신자`}
      />
      {headerActionTarget ? createPortal(actions, headerActionTarget) : actions}
      {adding && (
        <MessageListAddCustomersModal
          initialListId={listId}
          recipientType={adding}
          onClose={() => setAdding(null)}
          onAdded={async () => {
            if (page !== 0) setPage(0);
            else await refetch();
          }}
        />
      )}
      {loading && <p>{t`불러오는 중…`}</p>}
      {error && <p role="alert">{t`고객 분류를 불러오지 못했습니다.`}</p>}
      {!loading && !error && records.length === 0 && (
        <StyledMessageListEmpty>
          {t`아직 등록된 수신자가 없습니다.`}
          <br />
          {t`고객 또는 워크스페이스 멤버를 추가하세요.`}
        </StyledMessageListEmpty>
      )}
      {records.length > 0 && (
        <StyledTableScroll
          tabIndex={0}
          role="region"
          aria-label={t`등록된 수신자 표`}
        >
          <StyledMessageListTable>
            <TableRow gridTemplateColumns={MEMBER_GRID_COLUMNS}>
              <StyledMessageListHeader>{t`수신자`}</StyledMessageListHeader>
              <StyledMessageListHeader>{t`구분 / 소속`}</StyledMessageListHeader>
              <StyledMessageListHeader>{t`이메일`}</StyledMessageListHeader>
              <StyledMessageListHeader>{t`관리`}</StyledMessageListHeader>
            </TableRow>
            {records.map((member) => (
              <TableRow
                key={member.id}
                gridTemplateColumns={MEMBER_GRID_COLUMNS}
                hoverBackgroundColor={
                  themeCssVariables.background.transparent.light
                }
              >
                <StyledMessageListCell>
                  {member.person ? (
                    <RecordChip
                      objectNameSingular="person"
                      record={member.person}
                    />
                  ) : member.workspaceMember ? (
                    <RecordChip
                      objectNameSingular="workspaceMember"
                      record={member.workspaceMember}
                    />
                  ) : (
                    <StyledRecipientNotice>{t`삭제되었거나 접근할 수 없는 수신자`}</StyledRecipientNotice>
                  )}
                </StyledMessageListCell>
                <StyledMessageListCell>
                  <StyledMetadata
                    title={
                      member.person
                        ? [member.person.company?.name, member.person.jobTitle]
                            .filter(Boolean)
                            .join(' · ') || t`고객`
                        : member.workspaceMember
                          ? t`워크스페이스 멤버`
                          : ''
                    }
                  >
                    {member.person
                      ? [member.person.company?.name, member.person.jobTitle]
                          .filter(Boolean)
                          .join(' · ') || t`고객`
                      : member.workspaceMember
                        ? t`워크스페이스 멤버`
                        : ''}
                  </StyledMetadata>
                </StyledMessageListCell>
                <StyledMessageListCell>
                  {member.person?.emails?.primaryEmail ||
                  member.workspaceMember?.userEmail ? (
                    <EmailDisplay
                      value={
                        member.person?.emails?.primaryEmail ||
                        member.workspaceMember?.userEmail ||
                        ''
                      }
                    />
                  ) : (
                    <StyledRecipientNotice>{t`이메일 미등록 · 이메일 발송 시 제외됩니다`}</StyledRecipientNotice>
                  )}
                </StyledMessageListCell>
                <StyledMessageListCell align="center">
                  {permissions.canSoftDeleteObjectRecords && (
                    <Button
                      title={t`제외`}
                      size="small"
                      variant="tertiary"
                      disabled={busy}
                      onClick={() =>
                        runMutation(() => deleteOneRecord(member.id))
                      }
                    />
                  )}
                </StyledMessageListCell>
              </TableRow>
            ))}
          </StyledMessageListTable>
        </StyledTableScroll>
      )}
      {!error && (
        <RecordPaginationBar
          currentPage={page + 1}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={(nextPage) => {
            if (!loading && !busy) setPage(nextPage - 1);
          }}
        />
      )}
    </StyledSection>
  );
};
