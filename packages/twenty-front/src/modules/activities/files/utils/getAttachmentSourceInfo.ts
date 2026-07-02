import { type AttachmentEmailDirection } from '@/activities/files/constants/attachment-email-direction.constant';
import { type Attachment } from '@/activities/files/types/Attachment';
import { isDefined } from 'twenty-shared/utils';
import { isNonEmptyString } from '@sniptt/guards';

export type AttachmentSourceType = 'email' | 'note' | 'task';

export type AttachmentSourceInfo = {
  type: AttachmentSourceType;
  title?: string;
  messageThreadId?: string;
  emailDirection?: AttachmentEmailDirection;
  noteId?: string;
  taskId?: string;
};

export const getAttachmentSourceInfo = (
  attachment: Pick<
    Attachment,
    | 'targetMessageId'
    | 'targetMessage'
    | 'targetNoteId'
    | 'targetNote'
    | 'targetTaskId'
    | 'targetTask'
    | 'createdBy'
    | 'emailDirection'
  >,
): AttachmentSourceInfo | null => {
  if (isDefined(attachment.targetMessageId)) {
    const subject = attachment.targetMessage?.subject?.trim();
    const messageThreadId =
      attachment.targetMessage?.messageThreadId ??
      attachment.targetMessage?.messageThread?.id ??
      undefined;

    const emailDirection = attachment.emailDirection;

    return {
      type: 'email',
      title: isNonEmptyString(subject) ? subject : undefined,
      messageThreadId,
      emailDirection,
    };
  }

  if (attachment.createdBy?.source === 'EMAIL') {
    return { type: 'email' };
  }

  if (isDefined(attachment.targetNoteId)) {
    const title = attachment.targetNote?.title?.trim();

    return {
      type: 'note',
      title: isNonEmptyString(title) ? title : undefined,
      noteId: attachment.targetNoteId,
    };
  }

  if (isDefined(attachment.targetTaskId)) {
    const title = attachment.targetTask?.title?.trim();

    return {
      type: 'task',
      title: isNonEmptyString(title) ? title : undefined,
      taskId: attachment.targetTaskId,
    };
  }

  return null;
};
