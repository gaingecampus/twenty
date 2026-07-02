import { ATTACHMENT_EMAIL_DIRECTION } from '@/activities/files/constants/attachment-email-direction.constant';
import { getAttachmentSourceInfo } from '@/activities/files/utils/getAttachmentSourceInfo';

describe('getAttachmentSourceInfo', () => {
  it('should return email source with subject, thread id, and email direction', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: 'message-id',
        targetMessage: {
          id: 'message-id',
          subject: '  Test subject  ',
          messageThreadId: 'thread-id',
        },
        targetNoteId: null,
        targetNote: null,
        targetTaskId: null,
        targetTask: null,
        createdBy: undefined,
        emailDirection: ATTACHMENT_EMAIL_DIRECTION.INCOMING,
      }),
    ).toEqual({
      type: 'email',
      title: 'Test subject',
      messageThreadId: 'thread-id',
      emailDirection: ATTACHMENT_EMAIL_DIRECTION.INCOMING,
    });
  });

  it('should return outgoing direction from attachment emailDirection', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: 'message-id',
        targetMessage: {
          id: 'message-id',
          subject: 'Sent attachment',
          messageThreadId: 'thread-id',
        },
        targetNoteId: null,
        targetNote: null,
        targetTaskId: null,
        targetTask: null,
        createdBy: undefined,
        emailDirection: ATTACHMENT_EMAIL_DIRECTION.OUTGOING,
      })?.emailDirection,
    ).toBe(ATTACHMENT_EMAIL_DIRECTION.OUTGOING);
  });

  it('should return email source without direction when emailDirection is missing', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: 'message-id',
        targetMessage: {
          id: 'message-id',
          subject: 'Test subject',
          messageThreadId: 'thread-id',
        },
        targetNoteId: null,
        targetNote: null,
        targetTaskId: null,
        targetTask: null,
        createdBy: undefined,
        emailDirection: undefined,
      }),
    ).toEqual({
      type: 'email',
      title: 'Test subject',
      messageThreadId: 'thread-id',
      emailDirection: undefined,
    });
  });

  it('should return email source when only createdBy source is EMAIL', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: null,
        targetMessage: null,
        targetNoteId: null,
        targetNote: null,
        targetTaskId: null,
        targetTask: null,
        createdBy: {
          source: 'EMAIL',
          workspaceMemberId: null,
          name: 'Email',
        },
        emailDirection: undefined,
      }),
    ).toEqual({
      type: 'email',
    });
  });

  it('should return note source with title and note id', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: null,
        targetMessage: null,
        targetNoteId: 'note-id',
        targetNote: {
          id: 'note-id',
          title: '  Customer note  ',
        },
        targetTaskId: null,
        targetTask: null,
        createdBy: undefined,
        emailDirection: undefined,
      }),
    ).toEqual({
      type: 'note',
      title: 'Customer note',
      noteId: 'note-id',
    });
  });

  it('should return task source with title and task id', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: null,
        targetMessage: null,
        targetNoteId: null,
        targetNote: null,
        targetTaskId: 'task-id',
        targetTask: {
          id: 'task-id',
          title: 'Follow up task',
        },
        createdBy: undefined,
        emailDirection: undefined,
      }),
    ).toEqual({
      type: 'task',
      title: 'Follow up task',
      taskId: 'task-id',
    });
  });

  it('should prioritize email source over note source', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: 'message-id',
        targetMessage: {
          id: 'message-id',
          subject: 'Email subject',
          messageThreadId: 'thread-id',
        },
        targetNoteId: 'note-id',
        targetNote: {
          id: 'note-id',
          title: 'Note title',
        },
        targetTaskId: null,
        targetTask: null,
        createdBy: undefined,
        emailDirection: ATTACHMENT_EMAIL_DIRECTION.INCOMING,
      }),
    ).toEqual({
      type: 'email',
      title: 'Email subject',
      messageThreadId: 'thread-id',
      emailDirection: ATTACHMENT_EMAIL_DIRECTION.INCOMING,
    });
  });

  it('should return null when attachment has no source', () => {
    expect(
      getAttachmentSourceInfo({
        targetMessageId: null,
        targetMessage: null,
        targetNoteId: null,
        targetNote: null,
        targetTaskId: null,
        targetTask: null,
        createdBy: {
          source: 'MANUAL',
          workspaceMemberId: 'member-id',
          name: 'User',
        },
        emailDirection: undefined,
      }),
    ).toBeNull();
  });
});
