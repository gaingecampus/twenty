import { pickChartFiltersForObject } from '@/page-layout/utils/pickChartFiltersForObject';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';

export const replaceChartFiltersForObject = ({
  chartFilters,
  objectFieldMetadataIds,
  nextObjectChartFilters,
}: {
  chartFilters?: ChartFilters | null;
  objectFieldMetadataIds: Set<string>;
  nextObjectChartFilters: ChartFilters;
}): ChartFilters => {
  const fieldMetadataIdsFromOtherObjects = new Set(
    (chartFilters?.recordFilters ?? [])
      .map((recordFilter) => recordFilter.fieldMetadataId)
      .filter(
        (fieldMetadataId) => !objectFieldMetadataIds.has(fieldMetadataId),
      ),
  );

  const chartFiltersFromOtherObjects = pickChartFiltersForObject({
    chartFilters,
    validFieldMetadataIds: fieldMetadataIdsFromOtherObjects,
  });

  return {
    recordFilters: [
      ...(chartFiltersFromOtherObjects.recordFilters ?? []),
      ...(nextObjectChartFilters.recordFilters ?? []),
    ],
    recordFilterGroups: [
      ...(chartFiltersFromOtherObjects.recordFilterGroups ?? []),
      ...(nextObjectChartFilters.recordFilterGroups ?? []),
    ],
  };
};
