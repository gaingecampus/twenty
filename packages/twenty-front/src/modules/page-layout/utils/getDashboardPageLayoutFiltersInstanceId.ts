export const getDashboardPageLayoutFiltersInstanceId = ({
  pageLayoutId,
  objectMetadataItemId,
}: {
  pageLayoutId: string;
  objectMetadataItemId: string;
}): string => {
  return `dashboard-page-layout-filters-${pageLayoutId}-${objectMetadataItemId}`;
};
