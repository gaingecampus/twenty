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
  gap: ${themeCssVariables.spacing[5]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[8]};
`;

const StyledFieldGroup = styled.section`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledLabelRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledOptions = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledOptionsBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledAudience = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledFieldLabel = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  line-height: var(--t-label-line-height, 1.4);
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
      enqueueErrorSnackBar({
        message: t`고객 분류 이름을 먼저 입력하세요.`,
      });
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
        <StyledLabelRow>
          <CampaignFieldLabel
            label={t`From`}
            help={
              senderOptions.length === 0
                ? t`이메일 계정 연결 필요`
                : t`사용자 > 계정 > 이메일에서 연결을 완료한 이메일 계정만 선택할 수 있습니다.`
            }
          />
          {!loadingChannels && !channelsError && senderOptions.length === 0 && (
            <Button
              title="계정 연결"
              Icon={IconExternalLink}
              variant="secondary"
              accent="blue"
              size="small"
              to="/settings/accounts/emails"
            />
          )}
        </StyledLabelRow>
        <Select
          dropdownId="campaign-composer-from-account"
          dropdownWidthAuto
          callToActionButton={{
            text: t`이메일 계정 연결`,
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
        {(loadingChannels || channelsError) && (
          <StyledHint>
            {loadingChannels
              ? t`불러오는 중…`
              : channelsError
                ? t`계정 조회 실패 · 새로고침해 주세요`
                : null}
          </StyledHint>
        )}
      </StyledFieldGroup>
      <StyledFieldGroup>
        <StyledLabelRow>
          <CampaignFieldLabel
            label="받는 고객"
            help={
              isDefined(audiencePreview)
                ? buildAudienceHint(audiencePreview)
                : t`발송할 고객이 포함된 고객 분류를 선택하세요.`
            }
          />
          <Button
            title="목록 관리"
            Icon={IconExternalLink}
            variant="secondary"
            accent="blue"
            size="small"
            onClick={() =>
              window.open(
                '/objects/messageLists',
                '_blank',
                'noopener,noreferrer',
              )
            }
          />
        </StyledLabelRow>
        <FormSingleRecordPicker
          objectNameSingulars={['messageList']}
          defaultValue={campaignState.listId}
          onChange={campaignState.setListId}
          onCreate={handleCreateList}
        />
        {isDefined(audiencePreview) && (
          <StyledAudience role="status">
            <strong>발송 가능 {audiencePreview.sendable}명</strong>
          </StyledAudience>
        )}
      </StyledFieldGroup>
      <StyledFieldGroup>
        <StyledFieldLabel>{t`Subject`}</StyledFieldLabel>
        <FormTextFieldInput
          defaultValue={campaignState.subject}
          onChange={campaignState.setSubject}
          placeholder={t`Subject`}
        />
      </StyledFieldGroup>
      <StyledFieldGroup>
        <CampaignFieldLabel
          label="메시지"
          help="고객 정보 메뉴에서 이름·기업을 넣을 수 있어요. 정보가 없으면 빈칸으로 표시됩니다."
        />
        <FormAdvancedTextFieldInput
          defaultValue={campaignState.body}
          onChange={campaignState.setBody}
          placeholder="고객에게 전할 내용을 입력하세요"
          minHeight={180}
          maxWidth={600}
          contentType="html"
          renderToolbar={(insertText) => (
            <CampaignBodyVariablePicker onInsert={insertText} />
          )}
        />
      </StyledFieldGroup>
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
            <StyledHint>{t`불러오는 중…`}</StyledHint>
          ) : topicsError ? (
            <StyledHint role="alert">{t`주제 조회 실패 · 새로고침해 주세요`}</StyledHint>
          ) : null}
        </StyledOptionsBody>
      </StyledOptions>
      <StyledOptions>
        <CampaignFieldLabel
          label={
            campaignState.files.length
              ? `첨부 · ${campaignState.files.length}개`
              : '첨부'
          }
          help="최대 20개 · 총 25MB"
        />
        <StyledOptionsBody>
          <EmailAttachmentsField
            files={campaignState.files}
            onChange={campaignState.setFiles}
            onUploadingChange={campaignState.setIsUploading}
          />
        </StyledOptionsBody>
      </StyledOptions>
      <StyledOptions>
        <StyledOptionsBody>
          <StyledLabelRow>
            <label>
              <input
                type="checkbox"
                checked={campaignState.includeSignature}
                onChange={(event) =>
                  campaignState.setIncludeSignature(event.target.checked)
                }
              />
              {t`서명 포함`}
            </label>{' '}
            <Button
              title={t`서명 설정`}
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
          </StyledLabelRow>

          {campaignState.isEditing && (
            <StyledHint>{t`본문에 서명이 중복되지 않는지 확인해 주세요.`}</StyledHint>
          )}
          {campaignState.signatureLoading ? (
            <StyledHint>{t`서명 불러오는 중…`}</StyledHint>
          ) : campaignState.signatureError ? (
            <StyledHint role="alert">{t`서명 조회 실패 · 새로고침하거나 포함을 해제해 주세요.`}</StyledHint>
          ) : campaignState.includeSignature && campaignState.signature ? (
            <EmailSignaturePreview html={campaignState.signature} />
          ) : null}
        </StyledOptionsBody>
      </StyledOptions>
    </StyledFieldsContainer>
  );
};
