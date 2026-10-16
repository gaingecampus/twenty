import { CampaignTestEmail } from '@/activities/emails/components/CampaignTestEmail';
import { EmailSignaturePreview } from '@/settings/accounts/components/EmailSignaturePreview';
import { CampaignBodyVariablePicker } from '@/activities/emails/components/CampaignBodyVariablePicker';
import { EmailAttachmentsField } from '@/activities/emails/components/EmailAttachmentsField';
import { useId } from 'react';
import { IconExternalLink, IconInfoCircle } from 'twenty-ui/icon';
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
import { getConfiguredEmailChannels } from '@/settings/accounts/utils/getConfiguredEmailChannels';
import { isDefined } from 'twenty-shared/utils';
import { Button, type SelectOption } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[8]};
`;

const StyledFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFieldLabel = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  line-height: var(--t-label-line-height, 1.4);
  margin-top: ${themeCssVariables.spacing[1]};
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
      enqueueErrorSnackBar({ message: t`동반 고객 목록 이름을 먼저 입력하세요.` });
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

  const senderOptions: SelectOption<string>[] = getConfiguredEmailChannels(
    channels,
  )
    .map((channel) => channel.connectedAccount?.handle)
    .filter(isDefined)
    .filter((handle, index, handles) => handles.indexOf(handle) === index)
    .map((handle) => ({ label: handle, value: handle }));

  const topicOptions: SelectOption<string>[] = unsubscribeTopics.map(
    (topic) => ({
      label: topic.name ?? t`Untitled topic`,
      value: topic.id,
    }),
  );

  return (
    <StyledFieldsContainer>
      <StyledFieldGroup>
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
              ? t`사용자 > 계정 > 이메일에서 발신할 이메일 계정을 연결하세요. 워크스페이스 이메일 채널은 여기에 표시되지 않습니다.`
              : t`사용자 > 계정 > 이메일에서 연결을 완료한 이메일 계정만 선택할 수 있습니다.`
          }
        />
        <Select
          dropdownId="campaign-composer-from-account"
          dropdownWidthAuto
          callToActionButton={{
            text: t`계정 > 이메일 설정 열기 (새 탭)`,
            onClick: () =>
              window.open(
                '/settings/accounts/emails',
                '_blank',
                'noopener,noreferrer',
              ),
          }}
          fullWidth
          value={campaignState.fromAddress}
          options={senderOptions}
          emptyOption={{ label: t`Select a sender`, value: '' }}
          onChange={campaignState.setFromAddress}
        />
        {(loadingChannels || channelsError || senderOptions.length === 0) && (
          <StyledHint>
            {loadingChannels
              ? t`발신 계정을 불러오는 중입니다.`
              : channelsError
                ? t`발신 계정을 불러오지 못했습니다. 페이지를 새로 고침해 다시 시도하세요.`
                : senderOptions.length === 0
                  ? t`사용자 > 계정 > 이메일에서 발신할 이메일 계정을 연결하세요. 워크스페이스 이메일 채널은 여기에 표시되지 않습니다.`
                  : null}
          </StyledHint>
        )}
      </StyledFieldGroup>
      <StyledFieldGroup>
        <CampaignFieldLabel
          label={t`동반 고객 목록`}
          help={
            isDefined(audiencePreview)
              ? buildAudienceHint(audiencePreview)
              : t`발송할 고객이 포함된 동반 고객 목록을 선택하세요.`
          }
        />
        <FormSingleRecordPicker
          objectNameSingulars={['messageList']}
          defaultValue={campaignState.listId}
          onChange={campaignState.setListId}
          onCreate={handleCreateList}
        />
        <div>
          <Button
            title={t`동반 고객 목록 관리·고객 확인`}
            Icon={IconExternalLink}
            variant="secondary"
            size="small"
            onClick={() =>
              window.open(
                '/objects/messageLists',
                '_blank',
                'noopener,noreferrer',
              )
            }
          />
        </div>
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
      </StyledFieldGroup>
      <StyledFieldGroup>
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
          minHeight={240}
          maxWidth={600}
          contentType="html"
          renderToolbar={(insertText) => (
            <CampaignBodyVariablePicker onInsert={insertText} />
          )}
        />
        <StyledHint>{t`예: ${'{{fullName}}'}님, 안녕하세요. 심방콜 발송 시 각 고객의 정보로 바뀝니다. 값이 없으면 빈칸으로 표시됩니다. 위 메뉴의 변수만 지원하며 직접 입력할 수도 있습니다.`}</StyledHint>
      </StyledFieldGroup>
      <StyledFieldGroup>
        <StyledFieldLabel>{t`첨부 파일`}</StyledFieldLabel>
        <EmailAttachmentsField
          files={campaignState.files}
          onChange={campaignState.setFiles}
          onUploadingChange={campaignState.setIsUploading}
        />
        <StyledHint>{t`최대 20개, 총 25MB까지 첨부할 수 있습니다.`}</StyledHint>
      </StyledFieldGroup>
      <StyledFieldGroup>
        <StyledFieldLabel>{t`이메일 서명`}</StyledFieldLabel>
        <label>
          <input
            type="checkbox"
            checked={campaignState.includeSignature}
            onChange={(event) =>
              campaignState.setIncludeSignature(event.target.checked)
            }
          />
          {t`내 서명을 본문 아래에 포함`}
        </label>
        {campaignState.isEditing && (
          <StyledHint>{t`예약된 본문에는 기존 서명이 포함되어 있을 수 있습니다. 중복 추가 전에 본문을 확인하세요.`}</StyledHint>
        )}
        {campaignState.signatureLoading ? (
          <StyledHint>{t`서명을 불러오는 중입니다.`}</StyledHint>
        ) : campaignState.signatureError ? (
          <StyledHint role="alert">{t`서명을 불러오지 못했습니다. 새로 고침하거나 서명 포함을 해제하세요.`}</StyledHint>
        ) : campaignState.includeSignature && campaignState.signature ? (
          <EmailSignaturePreview html={campaignState.signature} />
        ) : (
          <StyledHint>{t`사용자 → 계정 → 이메일에서 내 HTML 서명을 등록할 수 있습니다.`}</StyledHint>
        )}
        <div>
          <Button
            title={t`이메일 서명 설정`}
            size="small"
            variant="secondary"
            Icon={IconExternalLink}
            onClick={() =>
              window.open(
                '/settings/accounts/emails',
                '_blank',
                'noopener,noreferrer',
              )
            }
          />
        </div>
      </StyledFieldGroup>
      <StyledFieldGroup>
        <StyledFieldLabel>{t`테스트 발송`}</StyledFieldLabel>
        <CampaignTestEmail
          campaignState={campaignState}
          connectedAccountId={
            getConfiguredEmailChannels(channels).find(
              (channel) =>
                channel.connectedAccount?.handle === campaignState.fromAddress,
            )?.connectedAccountId
          }
        />
      </StyledFieldGroup>
    </StyledFieldsContainer>
  );
};
