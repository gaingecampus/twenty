import { useId } from 'react';
import { IconInfoCircle } from 'twenty-ui/icon';
import { AppTooltip, TooltipDelay } from 'twenty-ui/surfaces';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { FormDateTimeFieldInput } from '@/object-record/record-field/ui/form-types/components/FormDateTimeFieldInput';
import { useUserTimezone } from '@/ui/input/components/internal/date/hooks/useUserTimezone';
import { styled } from '@linaria/react';

import { useCampaignAudiencePreview } from '@/activities/emails/hooks/useCampaignAudiencePreview';
import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { useUnsubscribeTopics } from '@/activities/emails/hooks/useUnsubscribeTopics';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { FormAdvancedTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormAdvancedTextFieldInput';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import { Select } from '@/ui/input/components/Select';
import { t } from '@lingui/core/macro';
import { MessageChannelType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type SelectOption } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledFieldLabel = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[1]};
  line-height: var(--t-label-line-height, 1.4);
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: var(--t-text-line-height-md, 1.45);
`;

const StyledInfoButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: help;
  display: inline-flex;
  padding: 0;
`;

const CampaignFieldLabel = ({
  label,
  help,
}: {
  label: string;
  help: string;
}) => {
  const id = `campaign-help-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <StyledFieldLabel>
      {label}
      <StyledInfoButton id={id} type="button" aria-label={`${label} 도움말`}>
        <IconInfoCircle size={16} />
      </StyledInfoButton>
      <AppTooltip
        anchorSelect={`#${id}`}
        content={help}
        place="top"
        delay={TooltipDelay.shortDelay}
        positionStrategy="fixed"
      />
    </StyledFieldLabel>
  );
};

type CampaignAudiencePreview = NonNullable<
  ReturnType<typeof useCampaignAudiencePreview>
>;

const buildAudienceHint = (preview: CampaignAudiencePreview): string => {
  const parts: string[] = [];

  if (preview.withoutEmail > 0) {
    parts.push(t`${preview.withoutEmail} without email`);
  }
  if (preview.duplicateEmails > 0) {
    parts.push(t`${preview.duplicateEmails} duplicate`);
  }
  if (preview.globallyUnsubscribed > 0) {
    parts.push(t`${preview.globallyUnsubscribed} unsubscribed from everything`);
  }
  if (preview.topicUnsubscribed > 0) {
    parts.push(t`${preview.topicUnsubscribed} opted out of this topic`);
  }

  const breakdown = parts.length > 0 ? ` (${parts.join(', ')})` : '';

  return (
    t`${preview.totalMembers} in this list — ${preview.sendable} sendable` +
    breakdown
  );
};

type CampaignComposerFieldsProps = {
  campaignState: ReturnType<typeof useCampaignComposerState>;
};

export const CampaignComposerFields = ({
  campaignState,
}: CampaignComposerFieldsProps) => {
  const { userTimezone } = useUserTimezone();
  const {
    channels,
    loading: loadingChannels,
    error: channelsError,
  } = useMyMessageChannels();
  const {
    unsubscribeTopics,
    loading: loadingTopics,
    error: topicsError,
  } = useUnsubscribeTopics();
  const { createOneRecord: createMessageList } = useCreateOneRecord({
    objectNameSingular: 'messageList',
  });

  const { enqueueErrorSnackBar } = useSnackBar();

  const handleCreateList = async (searchInput?: string) => {
    const listName = searchInput?.trim() ?? '';
    if (!listName) {
      enqueueErrorSnackBar({ message: t`세그먼트 이름을 먼저 입력하세요.` });
      return;
    }
    const createdList = await createMessageList({ name: listName });

    if (isDefined(createdList)) {
      campaignState.setListId(createdList.id);
    }
  };

  const audiencePreview = useCampaignAudiencePreview({
    listId: campaignState.listId,
    unsubscribeTopicId: campaignState.unsubscribeTopicId,
  });

  const senderOptions: SelectOption<string>[] = channels
    .filter((channel) => channel.type === MessageChannelType.EMAIL_GROUP)
    .map((channel) => channel.connectedAccount?.handle)
    .filter(isDefined)
    .map((handle) => ({ label: handle, value: handle }));

  const topicOptions: SelectOption<string>[] = unsubscribeTopics.map(
    (topic) => ({
      label: topic.name ?? t`Untitled topic`,
      value: topic.id,
    }),
  );

  return (
    <StyledFieldsContainer>
      {!campaignState.isEditing && (
        <>
          <StyledFieldLabel>{t`Send time`}</StyledFieldLabel>
          <Select
            dropdownId="campaign-send-mode"
            fullWidth
            value={campaignState.sendMode}
            options={[
              { label: t`Send immediately`, value: 'immediate' },
              { label: t`Schedule send`, value: 'scheduled' },
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

      <CampaignFieldLabel
        label={t`From`}
        help={
          senderOptions.length === 0
            ? t`선택 가능한 공용 이메일 발신 계정이 없습니다. 이메일 설정에서 계정을 연결하고 접근 권한을 확인하세요.`
            : t`이 캠페인을 보낼 공용 이메일 계정을 선택하세요.`
        }
      />
      <Select
        dropdownId="campaign-composer-from-account"
        dropdownWidthAuto
        callToActionButton={{
          text: t`발신 계정 설정 열기 (새 탭)`,
          onClick: () =>
            window.open('/settings/email', '_blank', 'noopener,noreferrer'),
        }}
        fullWidth
        value={campaignState.fromAddress}
        options={senderOptions}
        emptyOption={{ label: t`Select a sender`, value: '' }}
        onChange={campaignState.setFromAddress}
      />
      {(loadingChannels || channelsError) && (
        <StyledHint>
          {loadingChannels
            ? t`발신 계정을 불러오는 중입니다.`
            : channelsError
              ? t`발신 계정을 불러오지 못했습니다. 페이지를 새로 고침해 다시 시도하세요.`
              : senderOptions.length === 0
                ? t`선택 가능한 공용 이메일 발신 계정이 없습니다. 이메일 설정에서 계정을 연결하고 접근 권한을 확인하세요.`
                : null}
        </StyledHint>
      )}
      <CampaignFieldLabel
        label={t`세그먼트`}
        help={
          isDefined(audiencePreview)
            ? buildAudienceHint(audiencePreview)
            : t`발송할 고객이 포함된 세그먼트를 선택하세요.`
        }
      />
      <FormSingleRecordPicker
        objectNameSingulars={['messageList']}
        defaultValue={campaignState.listId}
        onChange={campaignState.setListId}
        onCreate={handleCreateList}
      />
      <StyledHint>
        <a href="/objects/messageLists" target="_blank" rel="noreferrer">
          {t`세그먼트 관리·포함된 고객 확인 (새 탭)`}
        </a>
      </StyledHint>
      <CampaignFieldLabel
        label={t`Unsubscribe topic`}
        help={
          (topicOptions.length === 0
            ? t`등록된 수신 거부 주제가 없습니다. 주제 없이 발송하거나 이메일 설정에서 주제를 만들 수 있습니다.` +
              ' '
            : '') +
          t`The unsubscribe topic this email belongs to. Recipients who opted out of it are skipped, and the unsubscribe link is scoped to it.`
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
        onChange={(value) =>
          campaignState.setUnsubscribeTopicId(value === '' ? null : value)
        }
      />
      {loadingTopics ? (
        <StyledHint>{t`수신 거부 주제를 불러오는 중입니다.`}</StyledHint>
      ) : topicsError ? (
        <StyledHint role="alert">{t`수신 거부 주제를 불러오지 못했습니다. 페이지를 새로 고침해 다시 시도하세요.`}</StyledHint>
      ) : null}
      <StyledFieldLabel>{t`Subject`}</StyledFieldLabel>
      <FormTextFieldInput
        defaultValue={campaignState.subject}
        onChange={campaignState.setSubject}
        placeholder={t`Subject`}
      />
      <StyledFieldLabel>{t`본문`}</StyledFieldLabel>
      <FormAdvancedTextFieldInput
        defaultValue={campaignState.body}
        onChange={campaignState.setBody}
        placeholder={t`Type something or press "/" to see commands`}
        minHeight={120}
        maxWidth={600}
        contentType="html"
      />
    </StyledFieldsContainer>
  );
};
