import { StyledMessageListToolbar } from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useUpdateManyRecordsMutation } from '@/object-record/hooks/useUpdateManyRecordsMutation';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getUpdateManyRecordsMutationResponseField } from '@/object-record/utils/getUpdateManyRecordsMutationResponseField';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { TextInput } from '@/ui/input/components/TextInput';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { WidgetHeaderActionContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderActionContext';
import { Button } from 'twenty-ui/input';
import { IconInfoCircle, IconLink, IconSearch, IconX } from 'twenty-ui/icon';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
  AnimatedPlaceholderEmptySubTitle,
} from 'twenty-ui/feedback';
import { AppTooltip, ModalHeader, ModalContent } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;
const StyledHeading = styled.h2`
  flex: 1;
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;
const StyledResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  max-height: 50vh;
  overflow-y: auto;
`;
const StyledCampaign = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding-block: ${themeCssVariables.spacing[2]};
`;
const StyledSubject = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;
const StyledEmpty = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding-block: ${themeCssVariables.spacing[4]};
`;
const StyledStatus = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
`;

export const MessageListLinkCampaign = ({
  listId,
  onLinked,
}: {
  listId: string;
  onLinked: () => Promise<unknown>;
}) => {
  const headerActionTarget = useContext(WidgetHeaderActionContext);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const modalId = useId();
  const helpId = `link-campaign-help-${modalId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { openModal, closeModal } = useModal();
  useEffect(() => () => closeModal(modalId), [closeModal, modalId]);
  const handleClose = () => {
    if (busy) return;
    closeModal(modalId);
    setOpen(false);
    setSearch('');
  };
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
          message: t`심방콜 발송 상태가 변경되었습니다. 연결 가능한 초안을 다시 선택하세요.`,
        });
        await refetch();
        return;
      }
      await onLinked();
      await refetch();
      closeModal(modalId);
      setOpen(false);
      setSearch('');
    } catch {
      enqueueErrorSnackBar({
        message: t`심방콜 발송을 연결하지 못했습니다. 다시 시도하세요.`,
      });
    } finally {
      setBusy(false);
    }
  };

  const trigger = permissions.canUpdateObjectRecords ? (
    <Button
      variant="secondary"
      size="small"
      Icon={IconLink}
      title={t`심방콜 발송 연결`}
      onClick={() => {
        setOpen(true);
        openModal(modalId);
      }}
      disabled={busy}
    />
  ) : null;

  return (
    <>
      {trigger &&
        (headerActionTarget ? (
          createPortal(trigger, headerActionTarget)
        ) : (
          <StyledMessageListToolbar>{trigger}</StyledMessageListToolbar>
        ))}
      {open && (
        <ModalStatefulWrapper
          modalInstanceId={modalId}
          size="medium"
          padding="none"
          gap={0}
          autoHeight
          isClosable
          onClose={handleClose}
          shouldCloseModalOnClickOutsideOrEscape={!busy}
          renderInDocumentBody
        >
          <div
            role="presentation"
            onKeyDownCapture={(event) => {
              if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                event.stopPropagation();
                handleClose();
              }
            }}
          >
            <ModalHeader autoHeight>
              <StyledHeader>
                <StyledHeading>{t`심방콜 발송 연결`}</StyledHeading>
                <Button
                  id={helpId}
                  Icon={IconInfoCircle}
                  ariaLabel={t`연결 가능한 발송 안내`}
                  variant="tertiary"
                  size="small"
                />
                <AppTooltip
                  anchorSelect={`#${helpId}`}
                  content={t`고객 분류가 지정되지 않은 초안만 연결할 수 있습니다.`}
                  positionStrategy="fixed"
                />
                <Button
                  Icon={IconX}
                  ariaLabel={t`닫기`}
                  variant="tertiary"
                  size="small"
                  disabled={busy}
                  onClick={handleClose}
                />
              </StyledHeader>
            </ModalHeader>
            <ModalContent contentPadding={5} gap={4}>
              <TextInput
                value={search}
                onChange={setSearch}
                placeholder={t`초안 제목 검색`}
                LeftIcon={IconSearch}
                fullWidth
                autoFocus
                disabled={busy}
              />
              {loading ? (
                <StyledStatus role="status">{t`불러오는 중…`}</StyledStatus>
              ) : error ? (
                <>
                  <StyledStatus role="alert">{t`초안을 불러오지 못했습니다.`}</StyledStatus>
                  <Button title={t`다시 시도`} onClick={() => refetch()} />
                </>
              ) : records.length === 0 ? (
                <StyledEmpty>
                  <AnimatedPlaceholder
                    type={search.trim() ? 'noMatchRecord' : 'emptyInbox'}
                  />
                  <AnimatedPlaceholderEmptyTextContainer>
                    <AnimatedPlaceholderEmptyTitle>
                      {search.trim()
                        ? t`검색 결과가 없습니다`
                        : t`연결할 초안이 없습니다`}
                    </AnimatedPlaceholderEmptyTitle>
                    <AnimatedPlaceholderEmptySubTitle>
                      {search.trim()
                        ? t`다른 제목으로 검색해 보세요.`
                        : t`심방콜 발송에서 초안을 만든 뒤 연결하세요.`}
                    </AnimatedPlaceholderEmptySubTitle>
                  </AnimatedPlaceholderEmptyTextContainer>
                </StyledEmpty>
              ) : (
                <StyledResults>
                  {records.map((campaign) => (
                    <StyledCampaign key={campaign.id}>
                      <StyledSubject>
                        {campaign.subject || t`제목 없는 심방콜 발송`}
                      </StyledSubject>
                      <Button
                        title={t`연결`}
                        ariaLabel={t`${campaign.subject || t`제목 없는 심방콜 발송`} 연결`}
                        size="small"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => linkCampaign(campaign.id)}
                      />
                    </StyledCampaign>
                  ))}
                  {hasNextPage && (
                    <Button
                      title={t`더 보기`}
                      disabled={busy}
                      onClick={() => fetchMoreRecords()}
                    />
                  )}
                </StyledResults>
              )}
            </ModalContent>
          </div>
        </ModalStatefulWrapper>
      )}
    </>
  );
};
