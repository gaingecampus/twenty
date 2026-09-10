import { useEffect, useState } from 'react';
import { useStatusBoardFindManyRecords } from '@/status-board/hooks/useStatusBoardFindManyRecords';

// KPI totals must include every page, unlike the preview lists.
export const useStatusBoardAllRecords = (
  options: Parameters<typeof useStatusBoardFindManyRecords>[0],
) => {
  const result = useStatusBoardFindManyRecords(options);
  const [fetchingPage, setFetchingPage] = useState(false);
  const key = JSON.stringify(options);
  const [failure, setFailure] = useState<{ key: string; error: Error }>();
  const paginationError = failure?.key === key ? failure.error : undefined;

  useEffect(() => {
    if (
      options.skip ||
      result.loading ||
      result.error ||
      paginationError ||
      !result.hasNextPage ||
      fetchingPage
    )
      return;
    setFetchingPage(true);
    void result
      .fetchMoreRecords()
      .then((page) => {
        if (page && 'error' in page && page.error) throw page.error;
      })
      .catch((error: unknown) => {
        setFailure({
          key,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      })
      .finally(() => {
        setFetchingPage(false);
      });
  }, [key, options.skip, paginationError, fetchingPage, result]);

  return {
    ...result,
    error: result.error ?? paginationError,
    loading:
      !options.skip &&
      (result.loading ||
        (result.hasNextPage && !paginationError && !result.error)),
  };
};
