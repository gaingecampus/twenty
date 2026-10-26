import { renderHook } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';

jest.mock('@apollo/client/react', () => ({ useQuery: jest.fn() }));
jest.mock('@/object-metadata/hooks/useApolloCoreClient', () => ({
  useApolloCoreClient: () => ({}),
}));
jest.mock('@/object-metadata/hooks/useObjectMetadataItem', () => ({
  useObjectMetadataItem: () => ({
    objectMetadataItem: { id: 'member', namePlural: 'messageListMembers' },
  }),
}));
jest.mock('@/object-record/hooks/useObjectPermissionsForObject', () => ({
  useObjectPermissionsForObject: jest.fn(),
}));
jest.mock('@/object-record/hooks/useFindManyRecordsQuery', () => ({
  useFindManyRecordsQuery: () => ({ findManyRecordsQuery: {} }),
}));

beforeEach(() => {
  jest
    .mocked(useObjectPermissionsForObject)
    .mockReturnValue({ canReadObjectRecords: true } as ReturnType<
      typeof useObjectPermissionsForObject
    >);
  jest.mocked(useQuery).mockReturnValue({
    data: {
      messageListMembers: {
        edges: [
          { node: { id: 'last-member', __typename: 'MessageListMember' } },
        ],
        totalCount: 1000,
      },
    },
    loading: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useQuery>);
});

it('requests the last 50-recipient page directly without loading the first 950', () => {
  const { result } = renderHook(() =>
    useMessageListRecordPage({
      objectNameSingular: 'messageListMember',
      filter: { listId: { eq: 'list' } },
      recordGqlFields: { id: true },
      page: 19,
      pageSize: 50,
    }),
  );
  expect(useQuery).toHaveBeenLastCalledWith(
    {},
    expect.objectContaining({
      fetchPolicy: 'no-cache',
      variables: expect.objectContaining({
        limit: 50,
        offset: 950,
        filter: { listId: { eq: 'list' } },
      }),
    }),
  );
  expect(result.current.totalCount).toBe(1000);
  expect(result.current.records).toHaveLength(1);
});

it.each(['loading', 'error', 'skip', 'permission'])(
  'does not show stale recipients when %s blocks the page',
  (reason) => {
    if (reason === 'permission')
      jest
        .mocked(useObjectPermissionsForObject)
        .mockReturnValue({ canReadObjectRecords: false } as ReturnType<
          typeof useObjectPermissionsForObject
        >);
    if (reason === 'loading' || reason === 'error') {
      jest.mocked(useQuery).mockReturnValue({
        data: {
          messageListMembers: {
            edges: [{ node: { id: 'stale' } }],
            totalCount: 1000,
          },
        },
        loading: reason === 'loading',
        error: reason === 'error' ? new Error('Unavailable') : undefined,
      } as ReturnType<typeof useQuery>);
    }
    const { result } = renderHook(() =>
      useMessageListRecordPage({
        objectNameSingular: 'messageListMember',
        recordGqlFields: { id: true },
        page: 1,
        pageSize: 50,
        skip: reason === 'skip',
      }),
    );
    expect(result.current.records).toEqual([]);
  },
);
