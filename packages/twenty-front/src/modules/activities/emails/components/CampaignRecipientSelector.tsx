import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type CampaignRecipientMode } from '@/activities/emails/types/CampaignRecipientMode';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledDirectField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRecipientInput = styled(TextInput)`
  && label {
    color: ${themeCssVariables.font.color.primary};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.medium};
    line-height: var(--t-label-line-height, 1.4);
    margin-bottom: ${themeCssVariables.spacing[2]};
  }

  && input {
    background: var(
      --t-input-background,
      ${themeCssVariables.background.transparent.lighter}
    );
    font-size: ${themeCssVariables.font.size.sm};
  }
`;

const StyledNotice = styled.div`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

type CampaignRecipientSelectorProps = {
  channel: 'email' | 'sms' | 'coupon';
  mode: CampaignRecipientMode;
  onModeChange: (mode: CampaignRecipientMode) => void;
  directValue: string;
  onDirectValueChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
};

export const CampaignRecipientSelector = ({
  channel,
  mode,
  onModeChange,
  directValue,
  onDirectValueChange,
  disabled = false,
  children,
}: CampaignRecipientSelectorProps) => {
  const isEmail = channel === 'email';
  const contactLabel = isEmail ? '이메일' : '폰번호';

  return (
    <StyledFields>
      <Select
        dropdownId={`${channel}-recipient-mode`}
        value={mode}
        disabled={disabled}
        options={[
          { value: 'direct', label: `${contactLabel} 직접 입력` },
          { value: 'list', label: '고객 분류' },
        ]}
        onChange={onModeChange}
        fullWidth
      />
      {mode === 'direct' ? (
        <StyledDirectField>
          <StyledRecipientInput
            label={`수신자 ${contactLabel}`}
            type={isEmail ? 'email' : 'tel'}
            autoComplete="off"
            placeholder={isEmail ? 'example@company.com' : '01012345678'}
            value={directValue}
            onChange={onDirectValueChange}
            disabled={disabled}
            fullWidth
          />
          {channel !== 'coupon' && (
            <StyledNotice role="alert">
              직접 입력 발송은 아직 지원하지 않습니다. 고객 분류를 선택해
              주세요.
            </StyledNotice>
          )}
        </StyledDirectField>
      ) : (
        children
      )}
    </StyledFields>
  );
};
