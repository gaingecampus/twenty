import { buildAttachmentsFilterForTargetableObject } from '@/activities/files/utils/build-attachments-filter-for-targetable-object.util';

describe('buildAttachmentsFilterForTargetableObject', () => {
  it('should return only direct target filter when note and task ids are empty', () => {
    expect(
      buildAttachmentsFilterForTargetableObject({
        targetableObjectFieldIdName: 'targetPersonId',
        targetableObjectId: 'person-id',
        noteIds: [],
        taskIds: [],
        personIds: [],
      }),
    ).toEqual({
      targetPersonId: {
        eq: 'person-id',
      },
    });
  });

  it('should include note and task filters in or when ids are provided', () => {
    expect(
      buildAttachmentsFilterForTargetableObject({
        targetableObjectFieldIdName: 'targetCompanyId',
        targetableObjectId: 'company-id',
        noteIds: ['note-1', 'note-2'],
        taskIds: ['task-1'],
        personIds: ['person-1', 'person-2'],
      }),
    ).toEqual({
      or: [
        {
          targetCompanyId: {
            eq: 'company-id',
          },
        },
        {
          targetNoteId: {
            in: ['note-1', 'note-2'],
          },
        },
        {
          targetTaskId: {
            in: ['task-1'],
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

  it('should include only note filter when task ids are empty', () => {
    expect(
      buildAttachmentsFilterForTargetableObject({
        targetableObjectFieldIdName: 'targetPersonId',
        targetableObjectId: 'person-id',
        noteIds: ['note-1'],
        taskIds: [],
        personIds: [],
      }),
    ).toEqual({
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
      ],
    });
  });
});
