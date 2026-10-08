import { MessageListCampaigns } from '@/activities/emails/components/message-lists/MessageListCampaigns';
import { Table } from '@/ui/layout/table/components/Table';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { Link } from 'react-router-dom';
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
  person: {
    name: { firstName: string; lastName: string };
    emails: { primaryEmail: string };
  } | null;
};

const StyledSection = styled.section`
  overflow: auto;
  width: 100%;
`;
const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-bottom: ${themeCssVariables.spacing[3]};
`;
const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0 0 ${themeCssVariables.spacing[3]};
`;
const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
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
      person: { id: true, name: true, emails: true },
    },
  });
  const permissions = useObjectPermissionsForObject(objectMetadataItem.id);
  const [adding, setAdding] = useState(false);
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
        message: t`수신자 목록을 변경하지 못했습니다. 다시 시도하세요.`,
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <StyledSection>
      <StyledToolbar>
        <span>{t`등록 고객 ${totalCount ?? 0}명`}</span>
        {permissions.canUpdateObjectRecords && (
          <Button
            title={t`고객 추가`}
            variant="primary"
            accent="blue"
            disabled={busy}
            onClick={() => setAdding(true)}
          />
        )}
      </StyledToolbar>
      <StyledHint>{t`이메일이 없거나 수신을 거부한 고객은 캠페인 발송 시 제외됩니다.`}</StyledHint>
      {adding && (
        <MessageListAddCustomersModal
          initialListId={listId}
          onClose={() => setAdding(false)}
          onAdded={refetch}
        />
      )}
      {loading && <p>{t`불러오는 중…`}</p>}
      {error && <p role="alert">{t`고객 목록을 불러오지 못했습니다.`}</p>}
      {!loading && !error && records.length === 0 && (
        <StyledEmpty>{t`아직 등록된 고객이 없습니다. 고객 추가 버튼으로 여러 고객을 선택하세요.`}</StyledEmpty>
      )}
      {records.length > 0 && (
        <Table>
          <TableRow gridTemplateColumns="minmax(120px, 1fr) minmax(120px, 1fr) 110px">
            <TableHeader>{t`고객`}</TableHeader>
            <TableHeader>{t`이메일`}</TableHeader>
            <TableHeader>{t`관리`}</TableHeader>
          </TableRow>
          {records.map((member) => (
            <TableRow
              key={member.id}
              gridTemplateColumns="minmax(120px, 1fr) minmax(120px, 1fr) 110px"
            >
              <TableCell>
                {member.person ? (
                  <Link to={`/object/person/${member.personId}`}>
                    {[
                      member.person?.name?.firstName,
                      member.person?.name?.lastName,
                    ]
                      .filter(Boolean)
                      .join(' ') || t`이름 없는 고객`}
                  </Link>
                ) : (
                  t`삭제되었거나 접근할 수 없는 고객`
                )}
              </TableCell>
              <TableCell>
                {member.person?.emails?.primaryEmail || t`이메일 없음`}
              </TableCell>
              <TableCell>
                {permissions.canSoftDeleteObjectRecords && (
                  <Button
                    title={t`목록에서 제외`}
                    disabled={busy}
                    onClick={() =>
                      runMutation(() => deleteOneRecord(member.id))
                    }
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
      {hasNextPage && (
        <Button
          title={t`고객 더 보기`}
          disabled={loading}
          onClick={() => fetchMoreRecords()}
        />
      )}
      <MessageListCampaigns listId={listId} />
    </StyledSection>
  );
};
