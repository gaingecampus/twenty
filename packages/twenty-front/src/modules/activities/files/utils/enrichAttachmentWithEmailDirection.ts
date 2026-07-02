import { type AttachmentEmailDirection } from '@/activities/files/constants/attachment-email-direction.constant';
import { type Attachment } from '@/activities/files/types/Attachment';
import { isDefined } from 'twenty-shared/utils';

export const enrichAttachmentWithEmailDirection = <
  TAttachment extends Pick<Attachment, 'targetMessageId' | 'emailDirection'>,
>(
  attachment: TAttachment,
  emailDirectionByMessageId: Record<string, AttachmentEmailDirection>,
): TAttachment => {
  if (isDefined(attachment.emailDirection)) {
    return attachment;
  }

  const messageId = attachment.targetMessageId;

  if (!isDefined(messageId)) {
    return attachment;
  }

  const emailDirection = emailDirectionByMessageId[messageId];

  if (!isDefined(emailDirection)) {
    return attachment;
  }

  return {
    ...attachment,
    emailDirection,
  };
};
