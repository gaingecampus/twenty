import { useEffect, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
// A separate query per object, then cursor pagination; never per contract.
export const useFieldManagementAllRecords = (
  options: Parameters<typeof useFindManyRecords>[0],
) => {
  const result = useFindManyRecords({ ...options, limit: 200 });
  const [paginationError, setPaginationError] = useState<Error>();
  const [fetching, setFetching] = useState(false);
  useEffect(() => {
    if (
      result.loading ||
      result.error ||
      fetching ||
      paginationError ||
      !result.hasNextPage
    )
      return;
    setFetching(true);
    void result
      .fetchMoreRecords()
      .then((page) => {
        if (page && 'error' in page && page.error) throw page.error;
      })
      .catch((error: unknown) =>
        setPaginationError(
          error instanceof Error ? error : new Error('추가 기록 조회 실패'),
        ),
      )
      .finally(() => setFetching(false));
  }, [result, fetching, paginationError]);
  return {
    ...result,
    refetch: async () => {
      setPaginationError(undefined);
      return result.refetch();
    },
    error: result.error ?? paginationError,
    loading:
      result.loading ||
      fetching ||
      (!!result.hasNextPage && !paginationError && !result.error),
  };
};
