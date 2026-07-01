import { type Attachment } from '@/activities/files/types/Attachment';
import { isDefined } from 'twenty-shared/utils';
import { isNonEmptyString } from '@sniptt/guards';

export type AttachmentSourceType = 'email';

export type AttachmentSourceInfo = {
  type: AttachmentSourceType;
  title?: string;
  messageThreadId?: string;
};

export const getAttachmentSourceInfo = (
  attachment: Pick<
    Attachment,
    'targetMessageId' | 'targetMessage' | 'createdBy'
  >,
): AttachmentSourceInfo | null => {
  if (isDefined(attachment.targetMessageId)) {
    const subject = attachment.targetMessage?.subject?.trim();
    const messageThreadId =
      attachment.targetMessage?.messageThreadId ??
      attachment.targetMessage?.messageThread?.id ??
      undefined;

    return {
      type: 'email',
      title: isNonEmptyString(subject) ? subject : undefined,
      messageThreadId,
    };
  }

  if (attachment.createdBy?.source === 'EMAIL') {
    return { type: 'email' };
  }

  return null;
};
