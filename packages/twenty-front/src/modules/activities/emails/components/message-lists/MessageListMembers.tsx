import { StyledMessageListEmpty } from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { RecordChip } from '@/object-record/components/RecordChip';
import { EmailDisplay } from '@/ui/field/display/components/EmailDisplay';
import { MessageListAddCustomersModal } from '@/activities/emails/components/message-lists/MessageListAddCustomersModal';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
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
const StyledWelcome = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
`;
const StyledIllustration = styled.img`
  flex-shrink: 0;
  height: 80px;
  object-fit: contain;
  width: 80px;
`;
const StyledHeading = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  margin: 0 0 ${themeCssVariables.spacing[2]};
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
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;
const StyledIdentity = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  overflow-wrap: anywhere;
`;
const StyledMetadata = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;
export const MessageListMembers = ({ listId }: { listId: string }) => {
  const [busy, setBusy] = useState(false);
  const { enqueueErrorSnackBar } = useSnackBar();
  const {
    records,
    totalCount,
    loading,
    error,
    refetch,
    hasNextPage,
    fetchMoreRecords,
    objectMetadataItem,
  } = useFindManyRecords<MessageListMember>({
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
      await refetch();
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
      <StyledWelcome>
        <StyledIllustration
          src="/images/gainge/customer-book.png"
          alt=""
          width={80}
          height={80}
        />
        <div>
          <StyledHeading>{t`함께할 고객을 모아보세요`}</StyledHeading>
          <StyledDescription>{t`고객을 추가하고, 심방콜로 안부를 전해보세요.`}</StyledDescription>
          {!loading && !error && (
            <StyledDescription>
              {t`등록된 수신자`} {totalCount ?? records.length}
              {hasNextPage && totalCount == null ? '+' : ''}
              {t`명`}
            </StyledDescription>
          )}
        </div>
      </StyledWelcome>
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
          onAdded={refetch}
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
      {hasNextPage && (
        <Button
          title={t`수신자 더 보기`}
          disabled={loading}
          onClick={() => fetchMoreRecords()}
        />
      )}
    </StyledSection>
  );
};
