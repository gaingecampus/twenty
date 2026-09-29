import { renderHook, waitFor, act } from '@testing-library/react';
import { useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFieldManagementAllRecords } from '@/field-management/useFieldManagementAllRecords';
jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));
const mockFind = jest.mocked(useFindManyRecords);
const options = {
  objectNameSingular: 'fieldVisit',
  recordGqlFields: { id: true },
};
type Result = ReturnType<typeof useFindManyRecords>;
describe('field records pagination', () => {
  beforeEach(() => jest.resetAllMocks());
  it('finishes only after every page is loaded', async () => {
    mockFind.mockImplementation(() => {
      const [page, setPage] = useState(1);
      return {
        records: Array.from({ length: page * 200 }, (_, id) => ({
          id: String(id),
          __typename: 'FieldVisit',
        })),
        loading: false,
        error: undefined,
        hasNextPage: page < 3,
        fetchMoreRecords: async () => {
          setPage((p) => p + 1);
        },
        refetch: jest.fn(),
      } as unknown as Result;
    });
    const { result } = renderHook(() => useFieldManagementAllRecords(options));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.records).toHaveLength(600);
  });
  it('surfaces a later page error and allows explicit retry', async () => {
    const fetchMoreRecords = jest
      .fn()
      .mockResolvedValue({ error: new Error('page failed') });
    mockFind.mockReturnValue({
      records: [],
      loading: false,
      hasNextPage: true,
      fetchMoreRecords,
      refetch: jest.fn(),
    } as unknown as Result);
    const { result } = renderHook(() => useFieldManagementAllRecords(options));
    await waitFor(() =>
      expect(result.current.error?.message).toBe('page failed'),
    );
    expect(fetchMoreRecords).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(fetchMoreRecords).toHaveBeenCalledTimes(2));
  });
});
