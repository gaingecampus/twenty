export const clampRecordIndexPage = (
  page: number,
  pageCount: number,
): number => {
  if (pageCount <= 0) {
    return 1;
  }

  return Math.min(Math.max(page, 1), pageCount);
};
