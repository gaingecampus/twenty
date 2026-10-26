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
import { useState } from 'react';
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
const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.6;
  margin: 0;
`;
const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledMembers = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;
const StyledMember = styled.li`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[2]} 0;
`;
const StyledIdentity = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  overflow-wrap: anywhere;
`;
const StyledMetadata = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;
export const MessageListMembers = ({ listId }: { listId: string }) => (
  <MessageListMembersPage key={listId} listId={listId} />
);

const MessageListMembersPage = ({ listId }: { listId: string }) => {
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
        message: t`동반 고객 목록을 변경하지 못했습니다. 다시 시도하세요.`,
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <StyledSection>
      {!loading && !error && (
        <StyledDescription>{t`등록된 수신자 ${totalCount}명`}</StyledDescription>
      )}
      <StyledActions>
        {permissions.canUpdateObjectRecords && (
          <Button
            title={t`고객 추가`}
            variant="primary"
            accent="blue"
            disabled={busy}
            onClick={() => setAdding('person')}
          />
        )}
        {permissions.canUpdateObjectRecords && (
          <Button
            title={t`워크스페이스 멤버 추가`}
            disabled={busy}
            onClick={() => setAdding('workspaceMember')}
          />
        )}
      </StyledActions>
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
      {error && <p role="alert">{t`동반 고객 목록을 불러오지 못했습니다.`}</p>}
      {!loading && !error && records.length === 0 && (
        <StyledMessageListEmpty>
          {t`아직 등록된 수신자가 없습니다.`}
          <br />
          {t`고객 또는 워크스페이스 멤버를 추가하세요.`}
        </StyledMessageListEmpty>
      )}
      {records.length > 0 && (
        <StyledMembers aria-label={t`등록된 수신자`}>
          {records.map((member) => (
            <StyledMember key={member.id}>
              <StyledIdentity>
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
                  t`삭제되었거나 접근할 수 없는 수신자`
                )}
                <StyledMetadata>
                  {member.person
                    ? [member.person.company?.name, member.person.jobTitle]
                        .filter(Boolean)
                        .join(' · ') || t`고객`
                    : member.workspaceMember
                      ? t`워크스페이스 멤버`
                      : ''}
                </StyledMetadata>
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
                  <StyledMetadata>{t`이메일 미등록 · 이메일 발송 시 제외됩니다`}</StyledMetadata>
                )}
              </StyledIdentity>
              {permissions.canSoftDeleteObjectRecords && (
                <Button
                  title={t`제외`}
                  size="small"
                  variant="tertiary"
                  disabled={busy}
                  onClick={() => runMutation(() => deleteOneRecord(member.id))}
                />
              )}
            </StyledMember>
          ))}
        </StyledMembers>
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
