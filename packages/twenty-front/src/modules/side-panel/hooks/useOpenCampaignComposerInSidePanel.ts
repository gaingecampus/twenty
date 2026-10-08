import { useCallback } from 'react';
import { useStore } from 'jotai';
import { type ScheduledCampaign } from '@/activities/emails/types/ScheduledCampaign';
import { campaignToEditComponentState } from '@/side-panel/pages/compose-campaign/states/campaignToEditComponentState';

import { SidePanelPages } from 'twenty-shared/types';
import { IconSend } from 'twenty-ui/icon';
import { v4 } from 'uuid';

import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { t } from '@lingui/core/macro';

export const useOpenCampaignComposerInSidePanel = () => {
  const store = useStore();
  const { navigateSidePanelMenu } = useSidePanelMenu();

  const openCampaignComposerInSidePanel = useCallback(
    (campaign: ScheduledCampaign | null = null) => {
      const pageId = v4();
      store.set(
        campaignToEditComponentState.atomFamily({ instanceId: pageId }),
        campaign,
      );
      navigateSidePanelMenu({
        page: SidePanelPages.ComposeCampaign,
        pageTitle: campaign ? t`Edit scheduled campaign` : t`New Campaign`,
        pageIcon: IconSend,
        pageId,
      });
    },
    [navigateSidePanelMenu, store],
  );

  return { openCampaignComposerInSidePanel };
};
