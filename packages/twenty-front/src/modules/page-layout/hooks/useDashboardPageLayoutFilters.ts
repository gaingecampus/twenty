import { EMPTY_DASHBOARD_PAGE_LAYOUT_FILTERS } from '@/page-layout/constants/EmptyDashboardPageLayoutFilters';
import { useCurrentPageLayout } from '@/page-layout/hooks/useCurrentPageLayout';
import { useIsPageLayoutInEditMode } from '@/page-layout/hooks/useIsPageLayoutInEditMode';
import { pageLayoutDashboardFiltersOverlayComponentState } from '@/page-layout/states/pageLayoutDashboardFiltersOverlayComponentState';
import { pageLayoutDraftComponentState } from '@/page-layout/states/pageLayoutDraftComponentState';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { isDefined } from 'twenty-shared/utils';

const toChartFilters = (
  chartFilters?: ChartFilters | null,
): ChartFilters | undefined => {
  if (!isDefined(chartFilters)) {
    return undefined;
  }

  return chartFilters;
};

export const useDashboardPageLayoutFilters = () => {
  const { currentPageLayout } = useCurrentPageLayout();
  const isPageLayoutInEditMode = useIsPageLayoutInEditMode();

  const pageLayoutDashboardFiltersOverlay = useAtomComponentStateValue(
    pageLayoutDashboardFiltersOverlayComponentState,
  );
  const setPageLayoutDashboardFiltersOverlay = useSetAtomComponentState(
    pageLayoutDashboardFiltersOverlayComponentState,
  );
  const setPageLayoutDraft = useSetAtomComponentState(
    pageLayoutDraftComponentState,
  );

  const persistedFilters = toChartFilters(
    currentPageLayout?.filters as ChartFilters | null | undefined,
  );

  const dashboardPageLayoutFilters =
    pageLayoutDashboardFiltersOverlay ??
    persistedFilters ??
    EMPTY_DASHBOARD_PAGE_LAYOUT_FILTERS;

  const setDashboardPageLayoutFilters = (chartFilters: ChartFilters) => {
    const nextFilters = {
      recordFilters: chartFilters.recordFilters ?? [],
      recordFilterGroups: chartFilters.recordFilterGroups ?? [],
    };

    setPageLayoutDashboardFiltersOverlay(nextFilters);

    if (isPageLayoutInEditMode) {
      setPageLayoutDraft((currentDraft) => ({
        ...currentDraft,
        filters: nextFilters,
      }));
    }
  };

  return {
    dashboardPageLayoutFilters,
    setDashboardPageLayoutFilters,
  };
};
