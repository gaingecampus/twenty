import { renderHook } from '@testing-library/react';

import { ATTACHMENT_EMAIL_DIRECTION } from '@/activities/files/constants/attachment-email-direction.constant';
import { useAttachments } from '@/activities/files/hooks/useAttachments';
import { CoreObjectNameSingular } from 'twenty-shared/types';

jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));

jest.mock('@/activities/files/hooks/useAttachmentEmailDirections', () => ({
  useAttachmentEmailDirections: jest.fn(),
}));

jest.mock('@/activities/files/hooks/useRelatedPersonIdsForAttachments', () => ({
  useRelatedPersonIdsForAttachments: jest.fn(),
}));

jest.mock('@/object-metadata/hooks/useObjectMetadataItem', () => ({
  useObjectMetadataItem: jest.fn(() => ({
    objectMetadataItem: { id: 'attachment-metadata-id' },
  })),
}));

jest.mock(
  '@/browser-event/hooks/useListenToObjectRecordOperationBrowserEvent',
  () => ({
    useListenToObjectRecordOperationBrowserEvent: jest.fn(),
  }),
);

describe('useAttachments', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRelatedPersonIds = () => {
    const useRelatedPersonIdsForAttachmentsMock = jest.requireMock(
      '@/activities/files/hooks/useRelatedPersonIdsForAttachments',
    );

    useRelatedPersonIdsForAttachmentsMock.useRelatedPersonIdsForAttachments.mockReturnValue(
      {
        relatedPersonIds: [],
        loading: false,
      },
    );
  };

  it('fetches attachments and enriches them with email direction', () => {
    mockRelatedPersonIds();
    const mockAttachments = [
      {
        id: '1',
        name: 'Attachment 1',
        targetMessageId: 'message-id',
      },
    ];
    const mockTargetableObject = {
      id: 'person-id',
      targetObjectNameSingular: 'person',
    };

    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useAttachmentEmailDirectionsMock = jest.requireMock(
      '@/activities/files/hooks/useAttachmentEmailDirections',
    );

    useFindManyRecordsMock.useFindManyRecords.mockImplementation(
      ({ objectNameSingular }: { objectNameSingular: string }) => {
        if (objectNameSingular === CoreObjectNameSingular.NoteTarget) {
          return { records: [], loading: false, refetch: jest.fn() };
        }

        if (objectNameSingular === CoreObjectNameSingular.TaskTarget) {
          return { records: [], loading: false, refetch: jest.fn() };
        }

        return {
          records: mockAttachments,
          loading: false,
          refetch: jest.fn(),
        };
      },
    );
    useAttachmentEmailDirectionsMock.useAttachmentEmailDirections.mockReturnValue(
      {
        emailDirectionByMessageId: {
          'message-id': ATTACHMENT_EMAIL_DIRECTION.INCOMING,
        },
        loading: false,
      },
    );

    const { result } = renderHook(() => useAttachments(mockTargetableObject));

    expect(result.current.attachments).toEqual([
      {
        id: '1',
        name: 'Attachment 1',
        targetMessageId: 'message-id',
        emailDirection: ATTACHMENT_EMAIL_DIRECTION.INCOMING,
      },
    ]);
  });

  it('builds attachment filter with related note and task ids', () => {
    mockRelatedPersonIds();
    const mockTargetableObject = {
      id: 'person-id',
      targetObjectNameSingular: 'person',
    };

    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useAttachmentEmailDirectionsMock = jest.requireMock(
      '@/activities/files/hooks/useAttachmentEmailDirections',
    );

    useFindManyRecordsMock.useFindManyRecords.mockImplementation(
      ({ objectNameSingular }: { objectNameSingular: string }) => {
        if (objectNameSingular === CoreObjectNameSingular.NoteTarget) {
          return {
            records: [{ id: 'note-target-1', note: { id: 'note-1' } }],
            loading: false,
            refetch: jest.fn(),
          };
        }

        if (objectNameSingular === CoreObjectNameSingular.TaskTarget) {
          return {
            records: [{ id: 'task-target-1', task: { id: 'task-1' } }],
            loading: false,
            refetch: jest.fn(),
          };
        }

        return {
          records: [],
          loading: false,
          refetch: jest.fn(),
        };
      },
    );
    useAttachmentEmailDirectionsMock.useAttachmentEmailDirections.mockReturnValue(
      {
        emailDirectionByMessageId: {},
        loading: false,
      },
    );

    renderHook(() => useAttachments(mockTargetableObject));

    const attachmentQueryCall =
      useFindManyRecordsMock.useFindManyRecords.mock.calls.find(
        ([params]: [{ objectNameSingular: string }]) =>
          params.objectNameSingular === CoreObjectNameSingular.Attachment,
      );

    expect(attachmentQueryCall?.[0].filter).toEqual({
      or: [
        {
          targetPersonId: {
            eq: 'person-id',
          },
        },
        {
          targetNoteId: {
            in: ['note-1'],
          },
        },
        {
          targetTaskId: {
            in: ['task-1'],
          },
        },
      ],
    });
  });

  it('skips activity target queries and uses note id directly on note pages', () => {
    mockRelatedPersonIds();
    const mockTargetableObject = {
      id: 'note-id',
      targetObjectNameSingular: 'note',
    };

    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useAttachmentEmailDirectionsMock = jest.requireMock(
      '@/activities/files/hooks/useAttachmentEmailDirections',
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
          objectNameSingular === CoreObjectNameSingular.NoteTarget ||
          objectNameSingular === CoreObjectNameSingular.TaskTarget
        ) {
          expect(skip).toBe(true);

          return { records: [], loading: false, refetch: jest.fn() };
        }

        return {
          records: [],
          loading: false,
          refetch: jest.fn(),
        };
      },
    );
    useAttachmentEmailDirectionsMock.useAttachmentEmailDirections.mockReturnValue(
      {
        emailDirectionByMessageId: {},
        loading: false,
      },
    );

    renderHook(() => useAttachments(mockTargetableObject));

    const attachmentQueryCall =
      useFindManyRecordsMock.useFindManyRecords.mock.calls.find(
        ([params]: [{ objectNameSingular: string }]) =>
          params.objectNameSingular === CoreObjectNameSingular.Attachment,
      );

    expect(attachmentQueryCall?.[0].filter).toEqual({
      targetNoteId: {
        eq: 'note-id',
      },
    });
  });

  it('handles case when there are no attachments', () => {
    mockRelatedPersonIds();
    const mockTargetableObject = {
      id: 'person-id',
      targetObjectNameSingular: 'person',
    };

    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useAttachmentEmailDirectionsMock = jest.requireMock(
      '@/activities/files/hooks/useAttachmentEmailDirections',
    );

    useFindManyRecordsMock.useFindManyRecords.mockImplementation(
      ({ objectNameSingular }: { objectNameSingular: string }) => {
        if (objectNameSingular === CoreObjectNameSingular.NoteTarget) {
          return { records: [], loading: false, refetch: jest.fn() };
        }

        if (objectNameSingular === CoreObjectNameSingular.TaskTarget) {
          return { records: [], loading: false, refetch: jest.fn() };
        }

        return {
          records: [],
          loading: false,
          refetch: jest.fn(),
        };
      },
    );
    useAttachmentEmailDirectionsMock.useAttachmentEmailDirections.mockReturnValue(
      {
        emailDirectionByMessageId: {},
        loading: false,
      },
    );

    const { result } = renderHook(() => useAttachments(mockTargetableObject));

    expect(result.current.attachments).toEqual([]);
  });

  it('builds company attachment filter with related person ids and expanded activity targets', () => {
    const useRelatedPersonIdsForAttachmentsMock = jest.requireMock(
      '@/activities/files/hooks/useRelatedPersonIdsForAttachments',
    );
    const useFindManyRecordsMock = jest.requireMock(
      '@/object-record/hooks/useFindManyRecords',
    );
    const useAttachmentEmailDirectionsMock = jest.requireMock(
      '@/activities/files/hooks/useAttachmentEmailDirections',
    );

    useRelatedPersonIdsForAttachmentsMock.useRelatedPersonIdsForAttachments.mockReturnValue(
      {
        relatedPersonIds: ['person-1', 'person-2'],
        loading: false,
      },
    );

    useFindManyRecordsMock.useFindManyRecords.mockImplementation(
      ({
        objectNameSingular,
        filter,
      }: {
        objectNameSingular: string;
        filter?: Record<string, unknown>;
      }) => {
        if (objectNameSingular === CoreObjectNameSingular.NoteTarget) {
          expect(filter).toEqual({
            or: [
              {
                targetCompanyId: {
                  eq: 'company-id',
                },
              },
              {
                targetPersonId: {
                  in: ['person-1', 'person-2'],
                },
              },
            ],
          });

          return {
            records: [
              { id: 'note-target-1', note: { id: 'note-on-employee' } },
            ],
            loading: false,
            refetch: jest.fn(),
          };
        }

        if (objectNameSingular === CoreObjectNameSingular.TaskTarget) {
          return {
            records: [
              { id: 'task-target-1', task: { id: 'task-on-employee' } },
            ],
            loading: false,
            refetch: jest.fn(),
          };
        }

        return {
          records: [],
          loading: false,
          refetch: jest.fn(),
        };
      },
    );
    useAttachmentEmailDirectionsMock.useAttachmentEmailDirections.mockReturnValue(
      {
        emailDirectionByMessageId: {},
        loading: false,
      },
    );

    renderHook(() =>
      useAttachments({
        id: 'company-id',
        targetObjectNameSingular: 'company',
      }),
    );

    const attachmentQueryCall =
      useFindManyRecordsMock.useFindManyRecords.mock.calls.find(
        ([params]: [{ objectNameSingular: string }]) =>
          params.objectNameSingular === CoreObjectNameSingular.Attachment,
      );

    expect(attachmentQueryCall?.[0].filter).toEqual({
      or: [
        {
          targetCompanyId: {
            eq: 'company-id',
          },
        },
        {
          targetNoteId: {
            in: ['note-on-employee'],
          },
        },
        {
          targetTaskId: {
            in: ['task-on-employee'],
          },
        },
        {
          targetPersonId: {
            in: ['person-1', 'person-2'],
          },
        },
      ],
    });
  });
});
