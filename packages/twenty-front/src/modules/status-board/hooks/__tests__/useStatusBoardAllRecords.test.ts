import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { useStatusBoardAllRecords } from '@/status-board/hooks/useStatusBoardAllRecords';
import { useStatusBoardFindManyRecords } from '@/status-board/hooks/useStatusBoardFindManyRecords';

jest.mock('@/status-board/hooks/useStatusBoardFindManyRecords');
const mockFind = jest.mocked(useStatusBoardFindManyRecords);
const options = {
  objectNameSingular: 'onboarding',
  limit: 200,
  recordGqlFields: { id: true },
};

describe('useStatusBoardAllRecords', () => {
  beforeEach(() => jest.resetAllMocks());
  it('loads all pages before exposing a finished total', async () => {
    mockFind.mockImplementation(() => {
      const [page, setPage] = useState(1);
      return {
        records: Array.from({ length: page * 200 }, (_, id) => ({
          id: String(id),
          __typename: 'Onboarding',
        })),
        loading: false,
        error: undefined,
        hasNextPage: page < 3,
        fetchMoreRecords: async () => {
          setPage((current) => current + 1);
        },
        refetch: jest.fn(),
      };
    });
    const { result } = renderHook(() => useStatusBoardAllRecords(options));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.records).toHaveLength(600);
  });
  it('reports a later page failure instead of a partial total and stops retrying', async () => {
    const fetchMoreRecords = jest
      .fn()
      .mockRejectedValue(new Error('page failed'));
    mockFind.mockReturnValue({
      records: [],
      loading: false,
      error: undefined,
      hasNextPage: true,
      fetchMoreRecords,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() => useStatusBoardAllRecords(options));
    await waitFor(() =>
      expect(result.current.error?.message).toBe('page failed'),
    );
    expect(result.current.loading).toBe(false);
    expect(fetchMoreRecords).toHaveBeenCalledTimes(1);
  });
  it('does not fetch when skipped', async () => {
    const fetchMoreRecords = jest.fn();
    mockFind.mockReturnValue({
      records: [],
      loading: false,
      error: undefined,
      hasNextPage: true,
      fetchMoreRecords,
      refetch: jest.fn(),
    });
    await act(async () => {
      renderHook(() => useStatusBoardAllRecords({ ...options, skip: true }));
    });
    expect(fetchMoreRecords).not.toHaveBeenCalled();
  });
});
