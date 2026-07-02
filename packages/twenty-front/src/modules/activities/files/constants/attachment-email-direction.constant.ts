export const ATTACHMENT_EMAIL_DIRECTION = {
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING',
} as const;

export type AttachmentEmailDirection =
  (typeof ATTACHMENT_EMAIL_DIRECTION)[keyof typeof ATTACHMENT_EMAIL_DIRECTION];
