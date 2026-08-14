import { dropChartRecordFiltersWithDeletedFields } from '@/side-panel/pages/page-layout/utils/dropChartRecordFiltersWithDeletedFields';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';

export const pickChartFiltersForObject = ({
  chartFilters,
  validFieldMetadataIds,
}: {
  chartFilters?: ChartFilters | null;
  validFieldMetadataIds: Set<string>;
}): ChartFilters => {
  return dropChartRecordFiltersWithDeletedFields({
    chartFilters: chartFilters ?? {},
    validFieldMetadataIds,
  });
};
