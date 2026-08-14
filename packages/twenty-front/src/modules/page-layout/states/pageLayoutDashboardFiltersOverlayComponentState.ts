import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';
import { PageLayoutComponentInstanceContext } from '@/page-layout/states/contexts/PageLayoutComponentInstanceContext';

export const pageLayoutDashboardFiltersOverlayComponentState =
  createAtomComponentState<ChartFilters | null>({
    key: 'pageLayoutDashboardFiltersOverlayComponentState',
    defaultValue: null,
    componentInstanceContext: PageLayoutComponentInstanceContext,
  });
