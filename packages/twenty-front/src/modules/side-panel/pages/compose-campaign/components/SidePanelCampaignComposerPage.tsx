import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useState } from 'react';
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
import { IconMail, IconMessage, IconSend } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/data-display';
import { Button, TabButton } from 'twenty-ui/input';
import { getOsControlSymbol } from 'twenty-ui/utilities';

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

const EmailCampaignComposer = () => {
  const { goBackFromSidePanel } = useSidePanelHistory();
  const sidePanelHeaderActionsElement = useAtomStateValue(
    sidePanelHeaderActionsElementState,
  );

  const campaignToEdit = useAtomComponentStateValue(
    campaignToEditComponentState,
  );
  const campaignState = useCampaignComposerState({
    onSent: goBackFromSidePanel,
    campaign: campaignToEdit,
  });

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
      <StyledContent>
        <CampaignComposerFields campaignState={campaignState} />
      </StyledContent>
      {isDefined(sidePanelHeaderActionsElement) &&
        createPortal(
          <>
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
              hotkeys={[getOsControlSymbol(), '⏎']}
              onClick={campaignState.handleSend}
              disabled={!campaignState.canSend}
            />
          </>,
          sidePanelHeaderActionsElement,
        )}
    </StyledContainer>
  );
};

const StyledChannelTabs = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[12]};
  padding: 0 ${themeCssVariables.spacing[4]};
`;

export const SidePanelCampaignComposerPage = () => {
  const [channel, setChannel] = useState<'email' | 'sms' | 'coupon'>('email');
  const campaignToEdit = useAtomComponentStateValue(
    campaignToEditComponentState,
  );
  return (
    <StyledContainer>
      {!campaignToEdit && (
        <StyledChannelTabs role="group" aria-label="발송 채널">
          <TabButton
            id="campaign-channel-email"
            title="이메일"
            LeftIcon={IconMail}
            contentSize="md"
            active={channel === 'email'}
            onClick={() => setChannel('email')}
          />
          <TabButton
            id="campaign-channel-sms"
            title="문자"
            LeftIcon={IconMessage}
            contentSize="md"
            active={channel === 'sms'}
            onClick={() => setChannel('sms')}
          />
          <TabButton
            id="campaign-channel-coupon"
            title="카카오 쿠폰"
            pill={<Tag color="orange" text="준비중" />}
            LeftIcon={IconSend}
            contentSize="md"
            active={channel === 'coupon'}
            onClick={() => setChannel('coupon')}
          />
        </StyledChannelTabs>
      )}
      {channel === 'coupon' && !campaignToEdit ? (
        <StyledContent>
          <CouponCampaignComposer />
        </StyledContent>
      ) : channel === 'sms' && !campaignToEdit ? (
        <StyledContent>
          <SmsCampaignComposerContent />
        </StyledContent>
      ) : (
        <EmailCampaignComposer />
      )}
    </StyledContainer>
  );
};
