import { getActivityAttachmentPathsAndName } from '@/activities/utils/getActivityAttachmentPathsAndName';
import { isNonEmptyArray, isNonEmptyString } from '@sniptt/guards';

type ActivityAttachmentsRelation =
  | Array<{ id: string }>
  | {
      edges?: Array<{ node?: { id: string } | null } | null> | null;
    }
  | null
  | undefined;

type ActivityWithAttachments = {
  bodyV2?: {
    blocknote?: string | null;
  } | null;
  attachments?: ActivityAttachmentsRelation;
};

const hasAttachmentsInRelation = (
  attachments: ActivityAttachmentsRelation,
): boolean => {
  if (Array.isArray(attachments)) {
    return attachments.length > 0;
  }

  if (!isNonEmptyArray(attachments?.edges)) {
    return false;
  }

  return attachments.edges.some((edge) => isNonEmptyString(edge?.node?.id));
};

export const activityHasAttachments = (
  activity: ActivityWithAttachments,
): boolean => {
  const blocknote = activity.bodyV2?.blocknote;

  if (
    isNonEmptyString(blocknote) &&
    getActivityAttachmentPathsAndName(blocknote).length > 0
  ) {
    return true;
  }

  return hasAttachmentsInRelation(activity.attachments);
};
