import { andMergeChartFilters } from '@/page-layout/utils/andMergeChartFilters';
import { pickChartFiltersForObject } from '@/page-layout/utils/pickChartFiltersForObject';
import { type BuildChartDrilldownQueryParamsInput } from '@/page-layout/widgets/graph/types/BuildChartDrilldownQueryParamsInput';
import { buildFilterFromChartBucket } from '@/page-layout/widgets/graph/utils/buildFilterFromChartBucket';
import { buildFilterQueryParams } from '@/page-layout/widgets/graph/utils/buildFilterQueryParams';
import { buildSortsFromChartConfig } from '@/page-layout/widgets/graph/utils/buildSortsFromChartConfig';
import { normalizeChartConfigurationFields } from '@/page-layout/widgets/graph/utils/normalizeChartConfigurationFields';
import { isDefined } from 'twenty-shared/utils';

export const buildChartDrilldownQueryParams = ({
  objectMetadataItem,
  configuration,
  clickedData,
  viewId,
  timezone,
  firstDayOfTheWeek,
  dashboardPageLayoutFilter,
}: BuildChartDrilldownQueryParamsInput): URLSearchParams => {
  const drilldownQueryParams = new URLSearchParams();

  const validFieldMetadataIds = new Set(
    objectMetadataItem.fields
      .filter((fieldMetadataItem) => fieldMetadataItem.isActive)
      .map((fieldMetadataItem) => fieldMetadataItem.id),
  );

  const dashboardFiltersForObject = pickChartFiltersForObject({
    chartFilters: dashboardPageLayoutFilter,
    validFieldMetadataIds,
  });

  const mergedChartFilter = andMergeChartFilters({
    left: configuration.filter,
    right: dashboardFiltersForObject,
  });

  const hasMergedChartFilters =
    (mergedChartFilter.recordFilters?.length ?? 0) > 0 ||
    (mergedChartFilter.recordFilterGroups?.length ?? 0) > 0;

  if (hasMergedChartFilters) {
    const chartFilterParams = buildFilterQueryParams({
      recordFilters: mergedChartFilter.recordFilters ?? [],
      recordFilterGroups: mergedChartFilter.recordFilterGroups ?? [],
      objectMetadataItem,
    });

    chartFilterParams.forEach((value, key) => {
      drilldownQueryParams.append(key, value);
    });
  }

  const { groupByFieldMetadataId, dateGranularity, groupBySubFieldName } =
    normalizeChartConfigurationFields(configuration);

  const primaryField = isDefined(groupByFieldMetadataId)
    ? objectMetadataItem.fields.find(
        (field) => field.id === groupByFieldMetadataId,
      )
    : undefined;

  if (isDefined(primaryField)) {
    const primaryFilters = buildFilterFromChartBucket({
      fieldMetadataItem: primaryField,
      bucketRawValue: clickedData.primaryBucketRawValue,
      dateGranularity,
      subFieldName: groupBySubFieldName,
      timezone,
      firstDayOfTheWeek,
    });

    primaryFilters.forEach((filter) => {
      drilldownQueryParams.append(
        `filter[${filter.fieldName}][${filter.operand}]`,
        filter.value,
      );
    });
  }

  const sorts = buildSortsFromChartConfig({
    configuration,
    objectMetadataItem,
  });

  sorts.forEach((sort) => {
    drilldownQueryParams.append(`sort[${sort.fieldName}]`, sort.direction);
  });

  if (isDefined(viewId)) {
    drilldownQueryParams.set('viewId', viewId);
  }

  return drilldownQueryParams;
};
