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

export const SidePanelCampaignComposerPage = () => {
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
