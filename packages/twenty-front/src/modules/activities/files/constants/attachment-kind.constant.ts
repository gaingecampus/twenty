export const ATTACHMENT_KIND = {
  FILE: 'FILE',
  EXTERNAL_LINK: 'EXTERNAL_LINK',
} as const;

export type AttachmentKind =
  (typeof ATTACHMENT_KIND)[keyof typeof ATTACHMENT_KIND];
