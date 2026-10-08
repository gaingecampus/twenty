import {
  StyledMessageListToolbar,
  StyledMessageListEmpty,
} from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { Table } from '@/ui/layout/table/components/Table';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableCell } from '@/ui/layout/table/components/TableCell';
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
  person:
    | (ObjectRecord & {
        name: { firstName: string; lastName: string };
        emails: { primaryEmail: string };
      })
    | null;
};

const StyledSection = styled.section`
  overflow: auto;
  width: 100%;
`;
export const MessageListMembers = ({ listId }: { listId: string }) => {
  const [busy, setBusy] = useState(false);
  const { enqueueErrorSnackBar } = useSnackBar();
  const {
    records,
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
        message: t`세그먼트를 변경하지 못했습니다. 다시 시도하세요.`,
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <StyledSection>
      <StyledMessageListToolbar>
        {permissions.canUpdateObjectRecords && (
          <Button
            title={t`고객 추가`}
            variant="primary"
            accent="blue"
            disabled={busy}
            onClick={() => setAdding(true)}
          />
        )}
      </StyledMessageListToolbar>
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
        <StyledMessageListEmpty>
          {t`아직 등록된 고객이 없습니다.`}
          <br />
          {t`고객 추가 버튼으로 여러 고객을 선택하세요.`}
        </StyledMessageListEmpty>
      )}
      {records.length > 0 && (
        <Table>
          <TableRow gridTemplateColumns="minmax(0, 1fr) minmax(0, 1.2fr) 72px">
            <TableHeader>{t`고객`}</TableHeader>
            <TableHeader>{t`이메일`}</TableHeader>
            <TableHeader align="right">{t`관리`}</TableHeader>
          </TableRow>
          {records.map((member) => (
            <TableRow
              key={member.id}
              gridTemplateColumns="minmax(0, 1fr) minmax(0, 1.2fr) 72px"
            >
              <TableCell minWidth="0" height={themeCssVariables.spacing[10]}>
                {member.person ? (
                  <RecordChip
                    objectNameSingular="person"
                    record={member.person}
                  />
                ) : (
                  t`삭제되었거나 접근할 수 없는 고객`
                )}
              </TableCell>
              <TableCell minWidth="0" height={themeCssVariables.spacing[10]}>
                {member.person?.emails?.primaryEmail ? (
                  <EmailDisplay value={member.person.emails.primaryEmail} />
                ) : (
                  t`이메일 없음`
                )}
              </TableCell>
              <TableCell align="right" height={themeCssVariables.spacing[10]}>
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
    </StyledSection>
  );
};
