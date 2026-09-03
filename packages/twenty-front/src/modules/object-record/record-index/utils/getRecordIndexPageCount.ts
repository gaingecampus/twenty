export const getRecordIndexPageCount = (
  totalCount: number,
  pageSize: number,
): number => {
  if (totalCount <= 0 || pageSize <= 0) {
    return 0;
  }

  return Math.ceil(totalCount / pageSize);
};
