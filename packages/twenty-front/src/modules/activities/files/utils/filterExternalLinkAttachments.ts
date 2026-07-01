import { ATTACHMENT_KIND } from '@/activities/files/constants/attachment-kind.constant';
import { type Attachment } from '@/activities/files/types/Attachment';
import { isNonEmptyString } from '@sniptt/guards';

export const filterExternalLinkAttachments = (
  attachments: Attachment[],
): Attachment[] => {
  return attachments.filter(
    (attachment) =>
      attachment.attachmentKind === ATTACHMENT_KIND.EXTERNAL_LINK &&
      isNonEmptyString(attachment.externalUrl),
  );
};
