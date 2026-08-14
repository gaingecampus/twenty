import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { EMPTY_DASHBOARD_PAGE_LAYOUT_FILTERS } from '@/page-layout/constants/EmptyDashboardPageLayoutFilters';
import { PageLayoutComponentInstanceContext } from '@/page-layout/states/contexts/PageLayoutComponentInstanceContext';
import { pageLayoutDashboardFiltersOverlayComponentState } from '@/page-layout/states/pageLayoutDashboardFiltersOverlayComponentState';
import { pageLayoutDraftComponentState } from '@/page-layout/states/pageLayoutDraftComponentState';
import { pageLayoutPersistedComponentState } from '@/page-layout/states/pageLayoutPersistedComponentState';
import { pickChartFiltersForObject } from '@/page-layout/utils/pickChartFiltersForObject';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';
import { useAvailableComponentInstanceId } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceId';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { PageLayoutType } from '~/generated-metadata/graphql';

export const useOptionalDashboardPageLayoutChartFilterForObject = ({
  objectMetadataItemId,
}: {
  objectMetadataItemId?: string;
}): ChartFilters => {
  const pageLayoutId = useAvailableComponentInstanceId(
    PageLayoutComponentInstanceContext,
  );
  const { objectMetadataItems } = useObjectMetadataItems();

  const pageLayoutDashboardFiltersOverlay = useAtomValue(
    pageLayoutDashboardFiltersOverlayComponentState.atomFamily({
      instanceId: pageLayoutId ?? '',
    }),
  );
  const persistedPageLayout = useAtomValue(
    pageLayoutPersistedComponentState.atomFamily({
      instanceId: pageLayoutId ?? '',
    }),
  );
  const draftPageLayout = useAtomValue(
    pageLayoutDraftComponentState.atomFamily({
      instanceId: pageLayoutId ?? '',
    }),
  );

  return useMemo(() => {
    if (!isDefined(pageLayoutId) || !isDefined(objectMetadataItemId)) {
      return EMPTY_DASHBOARD_PAGE_LAYOUT_FILTERS;
    }

    const layoutType = persistedPageLayout?.type ?? draftPageLayout.type;

    if (layoutType !== PageLayoutType.DASHBOARD) {
      return EMPTY_DASHBOARD_PAGE_LAYOUT_FILTERS;
    }

    const dashboardPageLayoutFilters =
      pageLayoutDashboardFiltersOverlay ??
      (persistedPageLayout?.filters as ChartFilters | null | undefined) ??
      draftPageLayout.filters ??
      EMPTY_DASHBOARD_PAGE_LAYOUT_FILTERS;

    const objectMetadataItem = objectMetadataItems.find(
      (objectMetadataItemToMatch) =>
        objectMetadataItemToMatch.id === objectMetadataItemId,
    );

    const validFieldMetadataIds = new Set(
      (objectMetadataItem?.fields ?? [])
        .filter((fieldMetadataItem) => fieldMetadataItem.isActive)
        .map((fieldMetadataItem) => fieldMetadataItem.id),
    );

    return pickChartFiltersForObject({
      chartFilters: dashboardPageLayoutFilters,
      validFieldMetadataIds,
    });
  }, [
    draftPageLayout.filters,
    draftPageLayout.type,
    objectMetadataItemId,
    objectMetadataItems,
    pageLayoutDashboardFiltersOverlay,
    pageLayoutId,
    persistedPageLayout?.filters,
    persistedPageLayout?.type,
  ]);
};
