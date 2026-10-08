import { type ScheduledCampaign } from '@/activities/emails/types/ScheduledCampaign';
import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const campaignToEditComponentState =
  createAtomComponentState<ScheduledCampaign | null>({
    key: 'side-panel/campaign-to-edit',
    defaultValue: null,
    componentInstanceContext: SidePanelPageComponentInstanceContext,
  });
