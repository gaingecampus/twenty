import {
  StyledMessageListToolbar,
  StyledMessageListEmpty,
} from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useUpdateManyRecordsMutation } from '@/object-record/hooks/useUpdateManyRecordsMutation';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getUpdateManyRecordsMutationResponseField } from '@/object-record/utils/getUpdateManyRecordsMutationResponseField';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { TextInput } from '@/ui/input/components/TextInput';
import { Table } from '@/ui/layout/table/components/Table';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { IconLink } from 'twenty-ui/icon';

export const MessageListLinkCampaign = ({
  listId,
  onLinked,
}: {
  listId: string;
  onLinked: () => Promise<unknown>;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const client = useApolloCoreClient();
  const { enqueueErrorSnackBar } = useSnackBar();
  const { updateManyRecordsMutation } = useUpdateManyRecordsMutation({
    objectNameSingular: 'messageCampaign',
  });
  const {
    records,
    objectMetadataItem,
    loading,
    error,
    hasNextPage,
    fetchMoreRecords,
    refetch,
  } = useFindManyRecords<ObjectRecord & { subject: string | null }>({
    objectNameSingular: 'messageCampaign',
    filter: {
      and: [
        { status: { eq: 'DRAFT' } },
        { listId: { is: 'NULL' } },
        ...(search.trim()
          ? [{ subject: { ilike: `%${search.trim()}%` } }]
          : []),
      ],
    },
    recordGqlFields: { id: true, subject: true },
    limit: 20,
    skip: !open,
  });
  const permissions = useObjectPermissionsForObject(objectMetadataItem.id);

  const linkCampaign = async (campaignId: string) => {
    setBusy(true);
    try {
      const result = await client.mutate<Record<string, { id: string }[]>>({
        mutation: updateManyRecordsMutation,
        variables: {
          filter: {
            and: [
              { id: { eq: campaignId } },
              { status: { eq: 'DRAFT' } },
              { listId: { is: 'NULL' } },
            ],
          },
          data: { listId },
        },
      });
      const responseField = getUpdateManyRecordsMutationResponseField(
        objectMetadataItem.namePlural,
      );
      if (!result.data?.[responseField]?.length) {
        enqueueErrorSnackBar({
          message: t`캠페인 상태가 변경되었습니다. 연결 가능한 초안을 다시 선택하세요.`,
        });
        await refetch();
        return;
      }
      await onLinked();
      await refetch();
      setOpen(false);
    } catch {
      enqueueErrorSnackBar({
        message: t`캠페인을 연결하지 못했습니다. 다시 시도하세요.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <StyledMessageListToolbar>
        {permissions.canUpdateObjectRecords && (
          <Button
            variant="secondary"
            size="small"
            Icon={IconLink}
            title={open ? t`닫기` : t`캠페인 연결`}
            onClick={() => setOpen(!open)}
            disabled={busy}
          />
        )}
      </StyledMessageListToolbar>
      {open && (
        <>
          <p>{t`세그먼트가 지정되지 않은 초안 캠페인을 연결할 수 있습니다.`}</p>
          <TextInput
            value={search}
            onChange={setSearch}
            placeholder={t`캠페인 검색`}
          />
          {loading && <p>{t`불러오는 중…`}</p>}
          {error && <p role="alert">{t`캠페인을 불러오지 못했습니다.`}</p>}
          {!loading && !error && records.length === 0 && (
            <StyledMessageListEmpty>{t`연결 가능한 초안 캠페인이 없습니다.`}</StyledMessageListEmpty>
          )}
          <Table>
            {records.map((campaign) => (
              <TableRow
                key={campaign.id}
                gridTemplateColumns="minmax(120px, 1fr) 90px"
              >
                <TableCell>{campaign.subject || t`제목 없는 캠페인`}</TableCell>
                <TableCell>
                  <Button
                    title={t`연결`}
                    disabled={busy}
                    onClick={() => linkCampaign(campaign.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </Table>
          {hasNextPage && (
            <Button
              title={t`캠페인 더 보기`}
              disabled={loading || busy}
              onClick={() => fetchMoreRecords()}
            />
          )}
        </>
      )}
    </div>
  );
};
