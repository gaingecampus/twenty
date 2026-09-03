export const getRecordIndexPageOffset = (
  page: number,
  pageSize: number,
): number => {
  return Math.max(page - 1, 0) * pageSize;
};
