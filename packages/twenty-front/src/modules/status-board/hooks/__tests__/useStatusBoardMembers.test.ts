import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useStatusBoardMembers } from '@/status-board/hooks/useStatusBoardMembers';
import { renderHook } from '@testing-library/react';

jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(() => ({ records: [], loading: false })),
}));

describe('useStatusBoardMembers', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['teamMember', 'member'])(
    'queries the resolved %s object',
    (nameSingular) => {
      renderHook(() =>
        useStatusBoardMembers({
          memberObjectMetadataItem: {
            nameSingular,
            readableFields: [],
          } as unknown as EnrichedObjectMetadataItem,
        }),
      );
      expect(useFindManyRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          objectNameSingular: nameSingular,
          skip: false,
        }),
      );
    },
  );

  it('skips the query when member metadata is unavailable', () => {
    renderHook(() =>
      useStatusBoardMembers({ memberObjectMetadataItem: undefined }),
    );
    expect(useFindManyRecords).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    );
  });
});
