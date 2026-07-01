export const EMAIL_ATTACHMENT_PENDING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

export const buildEmailAttachmentPendingCacheKey = ({
  workspaceId,
  messageId,
}: {
  workspaceId: string;
  messageId: string;
}) => `email-attachment-pending:${workspaceId}:${messageId}`;
