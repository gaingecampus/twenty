import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { useSendCampaignTestEmail } from '@/activities/emails/hooks/useSendCampaignTestEmail';
import { TextInput } from '@/ui/input/components/TextInput';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { z } from 'zod';
import { Callout } from 'twenty-ui/feedback';
import { IconSend } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

export const CampaignTestEmail = ({
  campaignState,
  connectedAccountId,
}: {
  campaignState: ReturnType<typeof useCampaignComposerState>;
  connectedAccountId?: string;
}) => {
  const { t } = useLingui();
  const [recipient, setRecipient] = useState('');
  const { sendTest, loading, result } = useSendCampaignTestEmail();
  const emailValid = z.email().safeParse(recipient.trim()).success;
  const busy =
    loading ||
    campaignState.isTestSending ||
    campaignState.loading ||
    campaignState.cancelling ||
    campaignState.isUploading;
  const canTest =
    !busy &&
    !!connectedAccountId &&
    emailValid &&
    campaignState.signatureReady &&
    campaignState.subject.trim().length > 0 &&
    campaignState.body.trim().length > 0;

  const handleSend = async () => {
    if (!canTest || !connectedAccountId) return;
    campaignState.setIsTestSending(true);
    try {
      await sendTest({
        connectedAccountId,
        to: recipient,
        subject: campaignState.subject,
        body: campaignState.bodyWithSignature,
        files: campaignState.files,
      });
    } finally {
      campaignState.setIsTestSending(false);
    }
  };

  return (
    <StyledContainer>
      <StyledHint>{t`입력한 주소 한 곳에만 현재 내용과 첨부파일을 즉시 보냅니다. 제목에 [테스트]가 붙으며, 동반 고객 목록 발송이나 예약 저장은 실행되지 않습니다.`}</StyledHint>
      <TextInput
        label={t`테스트 이메일 주소`}
        placeholder="name@example.com"
        type="email"
        fullWidth
        value={recipient}
        onChange={setRecipient}
        disabled={busy}
        error={
          recipient.length > 0 && !emailValid
            ? t`이메일 주소 한 개를 입력하세요.`
            : undefined
        }
      />
      <div>
        <Button
          title={loading ? t`테스트 발송 중…` : t`테스트 발송`}
          Icon={IconSend}
          variant="secondary"
          size="small"
          disabled={!canTest}
          onClick={handleSend}
        />
      </div>
      {!connectedAccountId && (
        <StyledHint>{t`먼저 보내는 사람에서 연결된 이메일 계정을 선택하세요.`}</StyledHint>
      )}
      {(campaignState.subject.trim().length === 0 ||
        campaignState.body.trim().length === 0) && (
        <StyledHint>{t`제목과 본문을 입력하면 테스트할 수 있습니다.`}</StyledHint>
      )}
      {/\{\{/.test(campaignState.subject + campaignState.body) && (
        <StyledHint>{t`테스트에서는 개인화 변수를 고객 정보로 치환하지 않고 입력한 그대로 보냅니다.`}</StyledHint>
      )}
      {result && (
        <div role={result.success ? 'status' : 'alert'}>
          <Callout
            variant={result.success ? 'info' : 'warning'}
            title={
              result.success
                ? t`테스트 발송 요청이 접수되었습니다`
                : t`테스트 발송 실패`
            }
            description={
              result.success
                ? t`${result.recipient} · [테스트] ${result.subject} — 메일 서버가 발송 요청을 접수했습니다. 받은편지함과 스팸함에서 내용을 확인하세요. 수신함 도착을 보장하는 결과는 아닙니다.`
                : t`${result.recipient} — ${result.error ?? ''}`
            }
          />
        </div>
      )}
    </StyledContainer>
  );
};
