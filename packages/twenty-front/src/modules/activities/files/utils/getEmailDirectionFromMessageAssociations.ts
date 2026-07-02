import { ATTACHMENT_EMAIL_DIRECTION } from '@/activities/files/constants/attachment-email-direction.constant';
import { type AttachmentEmailDirection } from '@/activities/files/constants/attachment-email-direction.constant';

type MessageChannelMessageAssociationWithDirection = {
  direction?: string | null;
};

export const getEmailDirectionFromMessageAssociations = (
  messageChannelMessageAssociations?:
    | MessageChannelMessageAssociationWithDirection[]
    | null,
): AttachmentEmailDirection | undefined => {
  const direction =
    messageChannelMessageAssociations?.[0]?.direction ?? undefined;

  if (direction === ATTACHMENT_EMAIL_DIRECTION.INCOMING) {
    return ATTACHMENT_EMAIL_DIRECTION.INCOMING;
  }

  if (direction === ATTACHMENT_EMAIL_DIRECTION.OUTGOING) {
    return ATTACHMENT_EMAIL_DIRECTION.OUTGOING;
  }

  return undefined;
};
