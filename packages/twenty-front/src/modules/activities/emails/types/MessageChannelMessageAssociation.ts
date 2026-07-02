import { type AttachmentEmailDirection } from '@/activities/files/constants/attachment-email-direction.constant';

export type MessageChannelMessageAssociation = {
  __typename: 'MessageChannelMessageAssociation';
  id: string;
  messageId: string;
  messageChannelId?: string;
  messageThreadExternalId?: string;
  messageExternalId?: string;
  direction?: AttachmentEmailDirection;
};
