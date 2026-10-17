import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useState } from 'react';
import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
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
import { IconSend } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { getOsControlSymbol } from 'twenty-ui/utilities';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
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
                campaignState.isEditing
                  ? t`Save schedule changes`
                  : campaignState.sendMode === 'scheduled'
                    ? t`Schedule campaign`
                    : t`Send campaign`
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
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

export const SidePanelCampaignComposerPage = () => {
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const campaignToEdit = useAtomComponentStateValue(
    campaignToEditComponentState,
  );
  return (
    <StyledContainer>
      {!campaignToEdit && (
        <StyledChannelTabs role="group" aria-label="발송 채널">
          <Button
            title="이메일"
            variant={channel === 'email' ? 'primary' : 'secondary'}
            accent={channel === 'email' ? 'blue' : 'default'}
            onClick={() => setChannel('email')}
          />
          <Button
            title="문자 · 뿌리오"
            variant={channel === 'sms' ? 'primary' : 'secondary'}
            accent={channel === 'sms' ? 'blue' : 'default'}
            onClick={() => setChannel('sms')}
          />
        </StyledChannelTabs>
      )}
      {channel === 'sms' && !campaignToEdit ? (
        <StyledContent>
          <SmsCampaignComposer />
        </StyledContent>
      ) : (
        <EmailCampaignComposer />
      )}
    </StyledContainer>
  );
};
