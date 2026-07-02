import { type FieldFilesValue } from '@/object-record/record-field/ui/types/FieldMetadata';

import { type AttachmentEmailDirection } from '@/activities/files/constants/attachment-email-direction.constant';
import { type AttachmentFileCategory } from './AttachmentFileCategory';
import { type AttachmentKind } from '@/activities/files/constants/attachment-kind.constant';

export type { AttachmentFileCategory };

export type Attachment = {
  id: string;
  name: string;
  /** @deprecated Use `file[0].url` field instead */
  fullPath: string;
  /** @deprecated Use `file[0].extension` field instead */
  fileCategory: AttachmentFileCategory;
  file: FieldFilesValue[] | null;
  companyId?: string | null;
  personId?: string | null;
  taskId?: string | null;
  noteId?: string | null;
  opportunityId?: string | null;
  dashboardId?: string | null;
  workflowId?: string | null;
  targetCompanyId?: string | null;
  targetPersonId?: string | null;
  targetTaskId?: string | null;
  targetNoteId?: string | null;
  targetOpportunityId?: string | null;
  targetDashboardId?: string | null;
  targetWorkflowId?: string | null;
  targetMessageId?: string | null;
  targetMessage?: {
    id: string;
    subject: string | null;
    messageThreadId: string | null;
    messageThread?: {
      id: string;
    } | null;
  } | null;
  targetNote?: {
    id: string;
    title: string | null;
  } | null;
  targetTask?: {
    id: string;
    title: string | null;
  } | null;
  emailDirection?: AttachmentEmailDirection;
  attachmentKind?: AttachmentKind | null;
  externalUrl?: string | null;
  createdBy?: {
    source: string;
    workspaceMemberId: string | null;
    name: string;
  };
  createdAt: string;
  __typename: string;
};
