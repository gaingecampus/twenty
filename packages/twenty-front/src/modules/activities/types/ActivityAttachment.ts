import { type FileCategory } from 'twenty-shared/types';
import { type FieldFilesValue } from '@/object-record/record-field/ui/types/FieldMetadata';

export type ActivityAttachment = {
  id: string;
  name?: string;
  fullPath?: string;
  fileCategory?: FileCategory;
  file?: FieldFilesValue[] | null;
};
