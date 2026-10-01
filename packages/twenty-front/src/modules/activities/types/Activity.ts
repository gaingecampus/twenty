import { type FieldActorValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { type ActivityAttachment } from '@/activities/types/ActivityAttachment';

export type Activity = {
  id: string;
  createdAt: string;
  createdBy?: FieldActorValue | null;
  updatedAt: string;
  title: string;
  bodyV2?: {
    blocknote: string | null;
    markdown: string | null;
  };
  attachments?: ActivityAttachment[] | null;
};
