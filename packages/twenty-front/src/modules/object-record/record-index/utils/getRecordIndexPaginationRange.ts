export const getRecordIndexPaginationRange = ({
  page,
  pageSize,
  totalCount,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
}): { from: number; to: number } => {
  if (totalCount <= 0) {
    return { from: 0, to: 0 };
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return { from, to };
};
