import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useDashboardPageLayoutFilters } from '@/page-layout/hooks/useDashboardPageLayoutFilters';
import { andMergeChartFilters } from '@/page-layout/utils/andMergeChartFilters';
import { pickChartFiltersForObject } from '@/page-layout/utils/pickChartFiltersForObject';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';
import { useMemo } from 'react';
import { type ChartFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const useMergedChartFilterForWidget = ({
  objectMetadataItemId,
  widgetFilter,
}: {
  objectMetadataItemId?: string | null;
  widgetFilter?: ChartFilter | ChartFilters | null;
}): ChartFilter => {
  const { dashboardPageLayoutFilters } = useDashboardPageLayoutFilters();
  const { objectMetadataItems } = useObjectMetadataItems();

  return useMemo(() => {
    const objectMetadataItem = objectMetadataItems.find(
      (objectMetadataItemToMatch) =>
        objectMetadataItemToMatch.id === objectMetadataItemId,
    );

    const validFieldMetadataIds = new Set(
      (objectMetadataItem?.fields ?? [])
        .filter((fieldMetadataItem) => fieldMetadataItem.isActive)
        .map((fieldMetadataItem) => fieldMetadataItem.id),
    );

    const dashboardFiltersForObject = isDefined(objectMetadataItemId)
      ? pickChartFiltersForObject({
          chartFilters: dashboardPageLayoutFilters,
          validFieldMetadataIds,
        })
      : {};

    return andMergeChartFilters({
      left: widgetFilter ?? {},
      right: dashboardFiltersForObject,
    });
  }, [
    dashboardPageLayoutFilters,
    objectMetadataItemId,
    objectMetadataItems,
    widgetFilter,
  ]);
};
