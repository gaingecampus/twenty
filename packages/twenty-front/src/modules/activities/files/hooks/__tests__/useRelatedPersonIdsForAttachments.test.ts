import { renderHook } from '@testing-library/react';

import { useRelatedPersonIdsForAttachments } from '@/activities/files/hooks/useRelatedPersonIdsForAttachments';
import { CoreObjectNameSingular } from 'twenty-shared/types';

jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));

jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: jest.fn(),
}));

describe('useRelatedPersonIdsForAttachments', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty related person ids for person records', () => {
    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useFindOneRecordMock = jest.requireMock(
      '@/object-record/hooks/useFindOneRecord',
    );

    useFindManyRecordsMock.useFindManyRecords.mockReturnValue({
      records: [],
      loading: false,
    });
    useFindOneRecordMock.useFindOneRecord.mockReturnValue({
      record: null,
      loading: false,
    });

    const { result } = renderHook(() =>
      useRelatedPersonIdsForAttachments({
        id: 'person-id',
        targetObjectNameSingular: CoreObjectNameSingular.Person,
      }),
    );

    expect(result.current.relatedPersonIds).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('returns company people ids for company records', () => {
    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useFindOneRecordMock = jest.requireMock(
      '@/object-record/hooks/useFindOneRecord',
    );

    useFindManyRecordsMock.useFindManyRecords.mockImplementation(
      ({
        objectNameSingular,
        skip,
      }: {
        objectNameSingular: string;
        skip?: boolean;
      }) => {
        if (
          objectNameSingular === CoreObjectNameSingular.Person &&
          skip === false
        ) {
          return {
            records: [{ id: 'person-1' }, { id: 'person-2' }],
            loading: false,
          };
        }

        return { records: [], loading: false };
      },
    );
    useFindOneRecordMock.useFindOneRecord.mockReturnValue({
      record: null,
      loading: false,
    });

    const { result } = renderHook(() =>
      useRelatedPersonIdsForAttachments({
        id: 'company-id',
        targetObjectNameSingular: CoreObjectNameSingular.Company,
      }),
    );

    expect(result.current.relatedPersonIds).toEqual(['person-1', 'person-2']);
  });

  it('merges point of contact and company people for opportunity records', () => {
    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useFindOneRecordMock = jest.requireMock(
      '@/object-record/hooks/useFindOneRecord',
    );

    useFindOneRecordMock.useFindOneRecord.mockReturnValue({
      record: {
        id: 'opportunity-id',
        pointOfContactId: 'poc-id',
        companyId: 'company-id',
      },
      loading: false,
    });

    useFindManyRecordsMock.useFindManyRecords.mockImplementation(
      ({
        objectNameSingular,
        skip,
      }: {
        objectNameSingular: string;
        skip?: boolean;
      }) => {
        if (
          objectNameSingular === CoreObjectNameSingular.Person &&
          skip === false
        ) {
          return {
            records: [{ id: 'poc-id' }, { id: 'person-2' }],
            loading: false,
          };
        }

        return { records: [], loading: false };
      },
    );

    const { result } = renderHook(() =>
      useRelatedPersonIdsForAttachments({
        id: 'opportunity-id',
        targetObjectNameSingular: CoreObjectNameSingular.Opportunity,
      }),
    );

    expect(result.current.relatedPersonIds).toEqual(['poc-id', 'person-2']);
  });
});
