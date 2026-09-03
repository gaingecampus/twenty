export const getVisibleRecordIndexPageNumbers = (
  currentPage: number,
  pageCount: number,
): Array<number | 'ellipsis'> => {
  if (pageCount <= 0) {
    return [];
  }

  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount, currentPage]);

  if (currentPage > 1) {
    pages.add(currentPage - 1);
  }

  if (currentPage < pageCount) {
    pages.add(currentPage + 1);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= pageCount)
    .toSorted((firstPage, secondPage) => firstPage - secondPage);

  const visiblePageNumbers: Array<number | 'ellipsis'> = [];

  for (const page of sortedPages) {
    const lastItem = visiblePageNumbers.at(-1);

    if (typeof lastItem === 'number' && page - lastItem > 1) {
      visiblePageNumbers.push('ellipsis');
    }

    visiblePageNumbers.push(page);
  }

  return visiblePageNumbers;
};
