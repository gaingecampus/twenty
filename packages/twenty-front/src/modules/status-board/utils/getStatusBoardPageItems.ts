// Returns 0-based page indexes with 'gap' markers, always keeping the first
// and last pages plus a window around the current one.
export const getStatusBoardPageItems = ({
  currentPage,
  pageCount,
  siblingCount = 1,
}: {
  currentPage: number;
  pageCount: number;
  siblingCount?: number;
}): (number | 'gap')[] => {
  const pages = new Set<number>([0, pageCount - 1]);
  for (
    let page = currentPage - siblingCount;
    page <= currentPage + siblingCount;
    page++
  ) {
    if (page >= 0 && page < pageCount) pages.add(page);
  }
  const sortedPages = [...pages]
    .filter((page) => page >= 0)
    .sort((a, b) => a - b);
  return sortedPages.flatMap((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage === undefined || page - previousPage === 1) return [page];
    // A single hidden page is shown instead of a gap marker.
    if (page - previousPage === 2) return [page - 1, page];
    return ['gap' as const, page];
  });
};
