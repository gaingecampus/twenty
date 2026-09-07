const MAX_VISIBLE_WITHOUT_ELLIPSIS = 7;
const EDGE_PAGE_COUNT = 5;
const SIBLING_COUNT = 1;

export const getVisibleRecordIndexPageNumbers = (
  currentPage: number,
  pageCount: number,
): Array<number | 'ellipsis'> => {
  if (pageCount <= 0) {
    return [];
  }

  if (pageCount <= MAX_VISIBLE_WITHOUT_ELLIPSIS) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>();
  const isNearStart = currentPage <= EDGE_PAGE_COUNT;
  const isNearEnd = currentPage >= pageCount - EDGE_PAGE_COUNT + 1;

  if (isNearStart) {
    const leadingCount = Math.min(
      pageCount,
      Math.max(EDGE_PAGE_COUNT, currentPage + SIBLING_COUNT),
    );

    for (let page = 1; page <= leadingCount; page++) {
      pages.add(page);
    }

    pages.add(pageCount);
  } else if (isNearEnd) {
    pages.add(1);

    const trailingStart = Math.max(
      1,
      Math.min(
        pageCount - EDGE_PAGE_COUNT + 1,
        currentPage - SIBLING_COUNT,
      ),
    );

    for (let page = trailingStart; page <= pageCount; page++) {
      pages.add(page);
    }
  } else {
    pages.add(1);
    pages.add(pageCount);

    for (
      let page = currentPage - SIBLING_COUNT;
      page <= currentPage + SIBLING_COUNT;
      page++
    ) {
      pages.add(page);
    }
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
