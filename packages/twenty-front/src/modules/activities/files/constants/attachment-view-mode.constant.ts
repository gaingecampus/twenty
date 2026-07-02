export const ATTACHMENT_VIEW_MODE = {
  LIST: 'list',
  GRID: 'grid',
} as const;

export type AttachmentViewMode =
  (typeof ATTACHMENT_VIEW_MODE)[keyof typeof ATTACHMENT_VIEW_MODE];
