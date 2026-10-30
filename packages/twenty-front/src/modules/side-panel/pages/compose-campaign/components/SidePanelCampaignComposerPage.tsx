import { type CampaignDraft } from 'twenty-shared/types';
import { useCampaignDraft } from '@/activities/emails/hooks/useCampaignDraft';
import { buildCampaignDraft } from '@/activities/emails/utils/buildCampaignDraft';
import { EmailCampaignRecipientFields } from '@/activities/emails/components/EmailCampaignRecipientFields';
import { CampaignDispatchOptions } from '@/activities/emails/components/CampaignDispatchOptions';
import { InlineBanner } from 'twenty-ui/feedback';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useState, type ReactNode } from 'react';
import { SmsCampaignComposerContent } from '@/activities/emails/components/SmsCampaignComposerContent';
import { CouponCampaignComposer } from '@/activities/emails/components/coupon/CouponCampaignComposer';
import { CampaignReviewModal } from '@/activities/emails/components/CampaignReviewModal';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { campaignToEditComponentState } from '@/side-panel/pages/compose-campaign/states/campaignToEditComponentState';
import { CampaignComposerFields } from '@/activities/emails/components/CampaignComposerFields';
import { useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { SIDE_PANEL_FOCUS_ID } from '@/side-panel/constants/SidePanelFocusId';
import { useSidePanelHistory } from '@/side-panel/hooks/useSidePanelHistory';
import { sidePanelHeaderActionsElementState } from '@/side-panel/states/sidePanelHeaderActionsElementState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { createPortal } from 'react-dom';
import { isDefined } from 'twenty-shared/utils';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import {
  IconAlertTriangle,
  IconMail,
  IconMessage,
  IconSend,
} from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/data-display';
import { Button, TabButton } from 'twenty-ui/input';

const StyledContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
`;

const EmailCampaignComposer = ({
  campaignState,
  saveDraft,
  savingDraft,
}: {
  campaignState: ReturnType<typeof useCampaignComposerState>;
  saveDraft: () => Promise<void>;
  savingDraft: boolean;
}) => {
  const sidePanelHeaderActionsElement = useAtomStateValue(
    sidePanelHeaderActionsElementState,
  );

  useHotkeysOnFocusedElement({
    keys: ['ctrl+Enter,meta+Enter'],
    callback: campaignState.handleSend,
    focusId: SIDE_PANEL_FOCUS_ID,
    dependencies: [campaignState.handleSend],
  });

  return (
    <StyledContainer>
      {campaignState.isReviewOpen && (
        <CampaignReviewModal campaignState={campaignState} />
      )}
      <CampaignComposerFields campaignState={campaignState} />
      {isDefined(sidePanelHeaderActionsElement) &&
        createPortal(
          <>
            {!campaignState.isEditing && (
              <Button
                size="small"
                variant="secondary"
                title={savingDraft ? '저장 중…' : '임시 저장'}
                onClick={saveDraft}
                disabled={
                  savingDraft ||
                  campaignState.loading ||
                  campaignState.isUploading ||
                  campaignState.isTestSending
                }
              />
            )}
            {campaignState.isEditing && (
              <Button
                size="small"
                variant="secondary"
                title={t`Cancel scheduled send`}
                onClick={campaignState.cancelSchedule}
                disabled={campaignState.cancelling || campaignState.loading}
              />
            )}
            <Button
              size="small"
              variant="primary"
              accent="blue"
              title={
                campaignState.isEditing ? t`예약 변경 검토` : t`발송 전 검토`
              }
              Icon={IconSend}
              onClick={campaignState.handleSend}
              disabled={!campaignState.canSend}
            />
          </>,
          sidePanelHeaderActionsElement,
        )}
    </StyledContainer>
  );
};

const StyledWarning = styled.div`
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]} 0;
`;

const StyledChannelTabs = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[12]};
  padding: 0 ${themeCssVariables.spacing[4]};
`;

export const SidePanelCampaignComposerPage = () => {
  const campaignToEdit = useAtomComponentStateValue(
    campaignToEditComponentState,
  );
  const initialDraft =
    campaignToEdit?.status === 'DRAFT' ? campaignToEdit.draftData : undefined;
  const isScheduledEdit = campaignToEdit?.status === 'SCHEDULED';
  const [channel, setChannel] = useState<CampaignDraft['channel']>(
    initialDraft?.channel ?? 'email',
  );
  const { saveDraft, saving, draftReference } =
    useCampaignDraft(campaignToEdit);
  const { goBackFromSidePanel } = useSidePanelHistory();
  const campaignState = useCampaignComposerState({
    onSent: goBackFromSidePanel,
    campaign: campaignToEdit,
    draftReference,
    savingDraft: saving,
  });
  const hasUnsupportedOptions =
    !isScheduledEdit &&
    channel !== 'email' &&
    (campaignState.sendMode === 'scheduled' ||
      campaignState.unsubscribeTopicId !== null);

  const saveChannelDraft = (fields: Partial<CampaignDraft>) =>
    saveDraft(
      buildCampaignDraft({
        ...fields,
        channel,
        sendMode:
          campaignState.sendMode === 'scheduled' ? 'scheduled' : 'immediate',
        scheduledAt: campaignState.scheduledAt,
        unsubscribeTopicId: campaignState.unsubscribeTopicId,
      }),
    );

  const renderDispatchOptions = (recipientFields: ReactNode) => (
    <>
      <CampaignDispatchOptions campaignState={campaignState}>
        {recipientFields}
      </CampaignDispatchOptions>
      {hasUnsupportedOptions && (
        <StyledWarning role="alert">
          <InlineBanner
            color="danger"
            LeftIcon={IconAlertTriangle}
            message="문자·선물하기는 아직 예약 발송과 수신 거부 주제를 지원하지 않아 발송할 수 없습니다. 즉시 발송·주제 없음으로 변경하거나 이메일을 선택해 주세요."
          />
        </StyledWarning>
      )}
    </>
  );

  return (
    <StyledContainer>
      {!isScheduledEdit && (
        <StyledChannelTabs role="group" aria-label="발송 채널">
          <TabButton
            id="campaign-channel-email"
            title="이메일"
            LeftIcon={IconMail}
            contentSize="md"
            active={channel === 'email'}
            onClick={() => !saving && setChannel('email')}
          />
          <TabButton
            id="campaign-channel-sms"
            title="문자"
            LeftIcon={IconMessage}
            contentSize="md"
            active={channel === 'sms'}
            onClick={() => !saving && setChannel('sms')}
          />
          <TabButton
            id="campaign-channel-coupon"
            title="카카오 쿠폰"
            pill={<Tag color="orange" text="준비중" />}
            LeftIcon={IconSend}
            contentSize="md"
            active={channel === 'coupon'}
            onClick={() => !saving && setChannel('coupon')}
          />
        </StyledChannelTabs>
      )}
      <StyledContent>
        {channel === 'coupon' && !isScheduledEdit ? (
          <CouponCampaignComposer
            initialDraft={
              initialDraft?.channel === channel ? initialDraft : undefined
            }
            draftReference={draftReference}
            savingDraft={saving}
            saveDraft={saveChannelDraft}
            isSendingDisabled={hasUnsupportedOptions}
            renderDispatchOptions={renderDispatchOptions}
          />
        ) : channel === 'sms' && !isScheduledEdit ? (
          <SmsCampaignComposerContent
            initialDraft={
              initialDraft?.channel === channel ? initialDraft : undefined
            }
            draftReference={draftReference}
            savingDraft={saving}
            saveDraft={saveChannelDraft}
            isSendingBlocked={hasUnsupportedOptions}
            renderDispatchOptions={renderDispatchOptions}
          />
        ) : (
          <>
            {renderDispatchOptions(
              <EmailCampaignRecipientFields campaignState={campaignState} />,
            )}
            <EmailCampaignComposer
              campaignState={campaignState}
              savingDraft={saving}
              saveDraft={() =>
                saveChannelDraft({
                  recipientMode: campaignState.recipientMode,
                  directRecipient: campaignState.directEmail,
                  listId: campaignState.listId,
                  fromAddress: campaignState.fromAddress,
                  subject: campaignState.subject,
                  body: campaignState.body,
                  files: campaignState.files,
                  includeSignature: campaignState.includeSignature,
                })
              }
            />
          </>
        )}
      </StyledContent>
    </StyledContainer>
  );
};
