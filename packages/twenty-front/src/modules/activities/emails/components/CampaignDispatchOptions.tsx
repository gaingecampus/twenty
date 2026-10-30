import { type ReactNode } from 'react';
import { CampaignFieldLabel } from '@/activities/emails/components/CampaignFieldLabel';
import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { useUnsubscribeTopics } from '@/activities/emails/hooks/useUnsubscribeTopics';
import { FormDateTimeFieldInput } from '@/object-record/record-field/ui/form-types/components/FormDateTimeFieldInput';
import { useUserTimezone } from '@/ui/input/components/internal/date/hooks/useUserTimezone';
import { Select } from '@/ui/input/components/Select';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { IconBolt, IconClock } from 'twenty-ui/icon';
import { type SelectOption } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledOptions = styled.section`
  display: flex;
  flex-direction: column;
`;

const StyledOptionsBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFieldLabel = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type CampaignDispatchOptionsProps = {
  children?: ReactNode;
  campaignState: Pick<
    ReturnType<typeof useCampaignComposerState>,
    | 'sendMode'
    | 'setSendMode'
    | 'scheduledAt'
    | 'setScheduledAt'
    | 'unsubscribeTopicId'
    | 'setUnsubscribeTopicId'
    | 'isEditing'
  >;
};

export const CampaignDispatchOptions = ({
  campaignState,
  children,
}: CampaignDispatchOptionsProps) => {
  const { userTimezone } = useUserTimezone();
  const {
    unsubscribeTopics,
    loading: loadingTopics,
    error: topicsError,
  } = useUnsubscribeTopics();
  const topicOptions: SelectOption<string>[] = unsubscribeTopics.map(
    (topic) => ({
      label: topic.name ?? t`Untitled topic`,
      value: topic.id,
    }),
  );

  return (
    <StyledContainer aria-label="공통 발송 설정">
      <StyledOptions>
        <StyledOptionsBody>
          {!campaignState.isEditing && (
            <>
              <StyledFieldLabel>{t`Send time`}</StyledFieldLabel>
              <Select
                dropdownId="campaign-send-mode"
                fullWidth
                value={campaignState.sendMode}
                options={[
                  {
                    label: t`Send immediately`,
                    value: 'immediate',
                    Icon: IconBolt,
                    iconThemeColor: 'red',
                  },
                  {
                    label: t`Schedule send`,
                    value: 'scheduled',
                    Icon: IconClock,
                    iconThemeColor: 'yellow',
                  },
                ]}
                onChange={campaignState.setSendMode}
              />
            </>
          )}
          {campaignState.sendMode === 'scheduled' && (
            <>
              <CampaignFieldLabel
                label={t`Scheduled at`}
                help={
                  t`Time zone: ${userTimezone}. Choose a time at least one minute from now.` +
                  ' ' +
                  t`Recipients are saved when scheduling. Unsubscribes are checked again before sending.`
                }
              />
              <FormDateTimeFieldInput
                defaultValue={campaignState.scheduledAt ?? undefined}
                onChange={campaignState.setScheduledAt}
                timeZone={userTimezone}
              />
            </>
          )}
        </StyledOptionsBody>
      </StyledOptions>
      <StyledOptions>
        <StyledOptionsBody>
          <CampaignFieldLabel
            label={t`Unsubscribe topic`}
            help={
              (topicOptions.length === 0
                ? t`등록된 수신 거부 주제가 없습니다. 주제 없이 발송하거나 이메일 설정에서 주제를 만들 수 있습니다.` +
                  ' '
                : '') +
              t`발송에 적용할 수신 거부 주제입니다. 해당 주제의 수신을 거부한 고객은 발송 대상에서 제외됩니다.`
            }
          />
          <Select
            dropdownId="campaign-composer-unsubscribe-topic"
            dropdownWidthAuto
            callToActionButton={{
              text: t`수신 거부 주제 설정 열기 (새 탭)`,
              onClick: () =>
                window.open('/settings/email', '_blank', 'noopener,noreferrer'),
            }}
            fullWidth
            value={campaignState.unsubscribeTopicId ?? ''}
            options={topicOptions}
            emptyOption={{ label: t`No topic`, value: '' }}
            emptyOptionIsPlaceholder
            onChange={(value) =>
              campaignState.setUnsubscribeTopicId(value === '' ? null : value)
            }
          />
          {loadingTopics ? (
            <StyledHint>{t`불러오는 중…`}</StyledHint>
          ) : topicsError ? (
            <StyledHint role="alert">{t`주제 조회 실패 · 새로고침해 주세요`}</StyledHint>
          ) : null}
        </StyledOptionsBody>
      </StyledOptions>
      {children}
    </StyledContainer>
  );
};
