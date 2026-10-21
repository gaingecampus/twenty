import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { useSendCampaignTestEmail } from '@/activities/emails/hooks/useSendCampaignTestEmail';
import { TextInput } from '@/ui/input/components/TextInput';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useId, useState } from 'react';
import { AppTooltip } from 'twenty-ui/surfaces';
import { z } from 'zod';
import { Callout } from 'twenty-ui/feedback';
import { IconInfoCircle, IconSend } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRow = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledInput = styled.div`
  flex: 1;
  min-width: 180px;
`;
const StyledHelp = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: help;
  display: flex;
  height: var(--t-input-height, 32px);
  padding: 0;
`;

export const CampaignTestEmail = ({
  campaignState,
  connectedAccountId,
}: {
  campaignState: ReturnType<typeof useCampaignComposerState>;
  connectedAccountId?: string;
}) => {
  const { t } = useLingui();
  const helpId = `test-email-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
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
      <StyledRow>
        <StyledInput>
          <TextInput
            aria-label="테스트 이메일 주소"
            placeholder="테스트 받을 이메일"
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
        </StyledInput>
        <div>
          <Button
            title={loading ? t`테스트 발송 중…` : t`테스트 발송`}
            Icon={IconSend}
            variant="secondary"
            size="medium"
            disabled={!canTest}
            onClick={handleSend}
          />
        </div>
        <StyledHelp id={helpId} type="button" aria-label="테스트 발송 도움말">
          <IconInfoCircle size={16} />
        </StyledHelp>
        <AppTooltip
          anchorSelect={`#${helpId}`}
          content="발신 계정·제목·본문·받을 주소를 입력하면 테스트할 수 있습니다. 입력한 주소로만 즉시 발송되며, 고객 정보 변수는 그대로 표시됩니다."
          positionStrategy="fixed"
          place="top"
        />
      </StyledRow>
      {result && (
        <div role={result.success ? 'status' : 'alert'}>
          <Callout
            variant={result.success ? 'info' : 'warning'}
            title={result.success ? t`테스트 발송 접수` : t`테스트 발송 실패`}
            description={
              result.success
                ? t`${result.recipient} · 받은편지함·스팸함을 확인해 주세요.`
                : t`${result.recipient} — ${result.error ?? ''}`
            }
          />
        </div>
      )}
    </StyledContainer>
  );
};
