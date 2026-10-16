import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { useCampaignAudiencePreview } from '@/activities/emails/hooks/useCampaignAudiencePreview';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { styled } from '@linaria/react';
import { useEffect, useId } from 'react';
import { Button } from 'twenty-ui/input';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledDetails = styled.dl`
  display: grid;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 100px minmax(0, 1fr);
  margin: 0;
  dt {
    color: ${themeCssVariables.font.color.secondary};
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;
const StyledPreview = styled.iframe`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  height: 260px;
  width: 100%;
`;
const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin: 0;
`;

export const CampaignReviewModal = ({
  campaignState,
}: {
  campaignState: ReturnType<typeof useCampaignComposerState>;
}) => {
  const modalId = useId();
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
  const scheduled = campaignState.sendMode === 'scheduled';
  const busy = campaignState.loading || campaignState.cancelling;
  const confirmLabel = campaignState.isEditing
    ? '확인 후 예약 변경 저장'
    : scheduled
      ? '확인 후 예약 발송'
      : '확인 후 발송';
  return (
    <ModalStatefulWrapper
      modalInstanceId={modalId}
      size="large"
      padding="none"
      gap={0}
      isClosable
      onClose={campaignState.closeReview}
      shouldCloseModalOnClickOutsideOrEscape={!busy}
      renderInDocumentBody
    >
      <ModalHeader hasBorderBottom>심방콜 발송 최종 검토</ModalHeader>
      <ModalContent contentPadding={5} gap={4}>
        <StyledDetails>
          <dt>보내는 사람</dt>
          <dd>{campaignState.fromAddress.trim()}</dd>
          <dt>동반 고객 목록</dt>
          <dd>
            {list?.name || '선택한 동반 고객 목록'}
            {audience &&
              ` · 발송 가능 ${audience.sendable}명 / 전체 ${audience.totalMembers}명`}
          </dd>
          <dt>발송 시점</dt>
          <dd>
            {scheduled && campaignState.scheduledAt
              ? `${new Date(campaignState.scheduledAt).toLocaleString('ko-KR')} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
              : '즉시 발송'}
          </dd>
          <dt>제목</dt>
          <dd>{campaignState.subject}</dd>
          <dt>첨부 파일</dt>
          <dd>
            {campaignState.files.length
              ? campaignState.files.map((file) => file.name).join(', ')
              : '없음'}
          </dd>
        </StyledDetails>
        <StyledPreview
          title="발송할 이메일 본문 미리보기"
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline';"><style>body{font:14px sans-serif;overflow-wrap:anywhere;}img{max-width:100%;}</style></head><body>${campaignState.bodyWithSignature}</body></html>`}
        />
        <StyledHint>
          본문에는 선택한 서명이 포함됩니다. 변수는 실제 발송 시 고객별 정보로
          바뀝니다. 외부 이미지는 이 미리보기에서 표시하지 않습니다.
        </StyledHint>
        <StyledHint>
          {scheduled
            ? '확인하면 이 내용으로 예약을 저장합니다. 수신 거부 여부는 발송 시 다시 확인합니다.'
            : '확인하면 선택한 동반 고객 목록으로 발송을 시작합니다. 발송 후에는 취소할 수 없습니다.'}
        </StyledHint>
      </ModalContent>
      <ModalFooter>
        <Button
          title="돌아가서 수정"
          variant="secondary"
          disabled={busy}
          onClick={campaignState.closeReview}
        />
        <Button
          title={busy ? '처리 중…' : confirmLabel}
          variant="primary"
          accent="blue"
          disabled={!campaignState.canSend}
          onClick={campaignState.confirmSend}
        />
      </ModalFooter>
    </ModalStatefulWrapper>
  );
};
