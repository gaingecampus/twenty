import { type SmsAudiencePreview } from '@/activities/emails/types/SmsAudiencePreview';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { styled } from '@linaria/react';
import { useEffect, useId } from 'react';
import { Button } from 'twenty-ui/input';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCounts = styled.dl`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  margin: 0;
  dt,
  dd {
    margin: 0;
  }
`;
const StyledCount = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;
  word-break: keep-all;
`;
const StyledFinalCount = styled(StyledCount)`
  color: ${themeCssVariables.color.blue};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;
const StyledMessage = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  max-height: 200px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
  white-space: pre-wrap;
`;
const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
  word-break: keep-all;
`;

export const SmsCampaignReviewModal = ({
  preview,
  sending,
  canSend,
  error,
  onClose,
  onConfirm,
}: {
  preview: SmsAudiencePreview;
  sending: boolean;
  canSend: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const modalId = useId();
  const { openModal, closeModal } = useModal();
  useEffect(() => {
    openModal(modalId);
    return () => closeModal(modalId);
  }, [openModal, closeModal, modalId]);
  const count = preview.sms + preview.lms;
  return (
    <ModalStatefulWrapper
      modalInstanceId={modalId}
      size="medium"
      padding="none"
      gap={0}
      isClosable
      onClose={() => {
        if (!sending) onClose();
      }}
      shouldCloseModalOnClickOutsideOrEscape={!sending}
      renderInDocumentBody
    >
      <ModalHeader>문자 발송 전 검토</ModalHeader>
      <ModalContent contentPadding={5} gap={4}>
        <StyledCounts>
          <StyledCount>
            <dt>전체 수신자</dt>
            <dd>{preview.total}명</dd>
          </StyledCount>
          <StyledCount>
            <dt>번호 없음 / 오류</dt>
            <dd>{preview.missing}명 제외</dd>
          </StyledCount>
          <StyledCount>
            <dt>중복 번호</dt>
            <dd>{preview.duplicates}명 제외</dd>
          </StyledCount>
          <StyledFinalCount>
            <dt>최종 발송 인원</dt>
            <dd>{count}명</dd>
          </StyledFinalCount>
        </StyledCounts>
        <StyledHint>
          제외된 수신자에게는 발송하지 않습니다. SMS {preview.sms}건 · LMS{' '}
          {preview.lms}건
        </StyledHint>
        {preview.missing > 0 && (
          <StyledHint>
            번호 없음·오류에는 구성원 계정 연결을 확인할 수 없는 경우도
            포함됩니다.
          </StyledHint>
        )}
        <StyledMessage aria-label="발송할 문자 미리보기">
          {preview.sample}
        </StyledMessage>
        {count === 0 && (
          <div role="alert">
            발송 가능한 수신자가 없습니다. 전화번호와 계정 연결을 수정한 뒤 다시
            검토해 주세요.
          </div>
        )}
        {error && <div role="alert">{error}</div>}
      </ModalContent>
      <ModalFooter autoHeight>
        <Button
          title="수정"
          variant="secondary"
          disabled={sending}
          onClick={onClose}
        />
        <Button
          title={sending ? '발송 요청 중…' : `${count}명에게 문자 발송`}
          isLoading={sending}
          variant="primary"
          accent="blue"
          disabled={!canSend || sending}
          onClick={onConfirm}
        />
      </ModalFooter>
    </ModalStatefulWrapper>
  );
};
