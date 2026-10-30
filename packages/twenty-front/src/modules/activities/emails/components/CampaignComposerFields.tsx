import { CampaignFieldLabel } from '@/activities/emails/components/CampaignFieldLabel';
import { StyledCampaignCheckboxLabel } from '@/activities/emails/components/StyledCampaignCheckboxLabel';
import { StyledCampaignOptionRow } from '@/activities/emails/components/StyledCampaignOptionRow';
import { EmailSignaturePreview } from '@/settings/accounts/components/EmailSignaturePreview';
import { CampaignBodyVariablePicker } from '@/activities/emails/components/CampaignBodyVariablePicker';
import { EmailAttachmentsField } from '@/activities/emails/components/EmailAttachmentsField';
import { IconExternalLink } from 'twenty-ui/icon';
import { styled } from '@linaria/react';

import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { FormAdvancedTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormAdvancedTextFieldInput';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import { Select } from '@/ui/input/components/Select';
import { t } from '@lingui/core/macro';
import { getConfiguredEmailChannels } from '@/settings/accounts/utils/getConfiguredEmailChannels';
import { isDefined } from 'twenty-shared/utils';
import { Button, Checkbox, type SelectOption } from 'twenty-ui/input';
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

const StyledMessageSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledOptionsBody = styled.div`
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
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: var(--t-text-line-height-md, 1.45);
`;

type CampaignComposerFieldsProps = {
  campaignState: ReturnType<typeof useCampaignComposerState>;
};

export const CampaignComposerFields = ({
  campaignState,
}: CampaignComposerFieldsProps) => {
  const {
    channels,
    loading: loadingChannels,
    error: channelsError,
  } = useMyMessageChannels();
  const senderOptions: SelectOption<string>[] = getConfiguredEmailChannels(
    channels,
  )
    .map((channel) => channel.connectedAccount?.handle)
    .filter(isDefined)
    .filter((handle, index, handles) => handles.indexOf(handle) === index)
    .map((handle) => ({ label: handle, value: handle }));

  return (
    <StyledFieldsContainer>
      <StyledFieldGroup>
        <StyledLabelRow>
          <CampaignFieldLabel
            label={t`발신자`}
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
          emptyOptionIsPlaceholder
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
        <StyledFieldLabel>{t`Subject`}</StyledFieldLabel>
        <FormTextFieldInput
          defaultValue={campaignState.subject}
          onChange={campaignState.setSubject}
          placeholder={t`제목을 입력하세요`}
        />
      </StyledFieldGroup>
      <StyledMessageSection aria-label="메시지 작성">
        <StyledFieldGroup as="div">
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
            renderToolbar={(insertText, { isFullScreen }) => (
              <CampaignBodyVariablePicker
                onInsert={insertText}
                isDropdownInModal={isFullScreen}
              />
            )}
          />
        </StyledFieldGroup>
        <StyledOptions>
          <StyledOptionsBody>
            <StyledCampaignOptionRow>
              <StyledCampaignCheckboxLabel>
                <Checkbox
                  hoverable={false}
                  checked={campaignState.includeSignature}
                  onCheckedChange={campaignState.setIncludeSignature}
                />
                <span>{t`서명 포함`}</span>
              </StyledCampaignCheckboxLabel>
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
            </StyledCampaignOptionRow>

            {campaignState.isEditing && (
              <StyledHint>{t`메시지에 서명이 중복되지 않는지 확인해 주세요.`}</StyledHint>
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
      </StyledMessageSection>
    </StyledFieldsContainer>
  );
};
