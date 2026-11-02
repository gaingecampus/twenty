import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const campaignInitialListIdComponentState = createAtomComponentState<
  string | null
>({
  key: 'side-panel/campaign-initial-list-id',
  defaultValue: null,
  componentInstanceContext: SidePanelPageComponentInstanceContext,
});
