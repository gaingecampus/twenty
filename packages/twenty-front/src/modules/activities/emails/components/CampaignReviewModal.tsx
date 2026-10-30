import { CampaignTestEmail } from '@/activities/emails/components/CampaignTestEmail';
import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import { getConfiguredEmailChannels } from '@/settings/accounts/utils/getConfiguredEmailChannels';
import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { useCampaignAudiencePreview } from '@/activities/emails/hooks/useCampaignAudiencePreview';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { styled } from '@linaria/react';
import { useEffect, useId } from 'react';
import { Button } from 'twenty-ui/input';
import { IconInfoCircle } from 'twenty-ui/icon';
import {
  AppTooltip,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledDetails = styled.dl`
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  margin: 0;
  dt {
    color: ${themeCssVariables.font.color.secondary};
    flex: 0 0 64px;
  }
  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;
const StyledDetailRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
`;
const StyledMessage = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;
const StyledSubject = styled.div`
  align-items: center;
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  overflow-wrap: anywhere;
`;
const StyledHelp = styled.button`
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: help;
  display: flex;
  flex-shrink: 0;
  padding: 0;
`;
const StyledPreview = styled.iframe`
  border: none;
  box-sizing: border-box;
  height: 200px;
  width: 100%;
`;
const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

export const CampaignReviewModal = ({
  campaignState,
}: {
  campaignState: ReturnType<typeof useCampaignComposerState>;
}) => {
  const modalId = useId();
  const helpId = `campaign-review-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { openModal, closeModal } = useModal();
  useEffect(() => {
    openModal(modalId);
    return () => closeModal(modalId);
  }, [openModal, closeModal, modalId]);
  const { record: list } = useFindOneRecord<ObjectRecord & { name: string }>({
    objectNameSingular: 'messageList',
    objectRecordId: campaignState.listId ?? '',
    recordGqlFields: { id: true, name: true },
  });
  const audience = useCampaignAudiencePreview({
    listId: campaignState.listId,
    unsubscribeTopicId: campaignState.unsubscribeTopicId,
  });
  const { channels } = useMyMessageChannels();
  const connectedAccountId = getConfiguredEmailChannels(channels).find(
    (channel) => channel.connectedAccount?.handle === campaignState.fromAddress,
  )?.connectedAccountId;
  const scheduled = campaignState.sendMode === 'scheduled';
  const submitting = campaignState.loading || campaignState.cancelling;
  const busy = submitting || campaignState.isTestSending;
  const confirmLabel = campaignState.isEditing
    ? '예약 변경'
    : scheduled
      ? '예약 발송'
      : '발송하기';
  return (
    <ModalStatefulWrapper
      modalInstanceId={modalId}
      size="large"
      padding="none"
      gap={0}
      isClosable
      onClose={() => {
        if (!busy) campaignState.closeReview();
      }}
      shouldCloseModalOnClickOutsideOrEscape={!busy}
      renderInDocumentBody
    >
      <ModalHeader>발송 전 검토</ModalHeader>
      <ModalContent contentPadding={5} gap={4}>
        <StyledDetails>
          <StyledDetailRow>
            <dt>발신자</dt>
            <dd>{campaignState.fromAddress.trim()}</dd>
          </StyledDetailRow>
          <StyledDetailRow>
            <dt>수신자</dt>
            <dd>
              {list?.name || '선택한 고객 분류'}
              {audience
                ? ` · ${audience.sendable}명 / 전체 ${audience.totalMembers}명`
                : ' · 인원 확인 중'}
            </dd>
          </StyledDetailRow>
          <StyledDetailRow>
            <dt>발송 시점</dt>
            <dd>
              {scheduled && campaignState.scheduledAt
                ? `${new Date(campaignState.scheduledAt).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
                : '즉시 발송'}
            </dd>
          </StyledDetailRow>
          {campaignState.files.length > 0 && (
            <StyledDetailRow>
              <dt>첨부</dt>
              <dd>{campaignState.files.map((file) => file.name).join(', ')}</dd>
            </StyledDetailRow>
          )}
        </StyledDetails>
        <StyledMessage>
          <StyledSubject>
            {campaignState.subject}
            <StyledHelp id={helpId} type="button" aria-label="미리보기 도움말">
              <IconInfoCircle size={16} />
            </StyledHelp>
          </StyledSubject>
          <AppTooltip
            anchorSelect={`#${helpId}`}
            content="선택한 서명이 포함됩니다. 고객 정보는 실제 발송 시 바뀌며, 외부 이미지는 미리보기에서 숨깁니다."
            positionStrategy="fixed"
            place="top"
          />
          <StyledPreview
            title="발송할 메시지 미리보기"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline';"><style>body{font:14px sans-serif;overflow-wrap:anywhere;margin:0;}img{max-width:100%;}</style></head><body>${campaignState.bodyWithSignature}</body></html>`}
          />
        </StyledMessage>
        <CampaignTestEmail
          campaignState={campaignState}
          connectedAccountId={connectedAccountId}
        />
        <StyledHint>
          {scheduled
            ? '예약 시각에 수신 거부 여부를 다시 확인합니다.'
            : '발송 후에는 취소할 수 없어요.'}
        </StyledHint>
      </ModalContent>
      <ModalFooter autoHeight>
        <Button
          title="수정"
          variant="secondary"
          disabled={busy}
          onClick={campaignState.closeReview}
        />
        <Button
          title={submitting ? '처리 중…' : confirmLabel}
          variant="primary"
          accent="blue"
          disabled={!campaignState.canSend}
          onClick={campaignState.confirmSend}
        />
      </ModalFooter>
    </ModalStatefulWrapper>
  );
};
