import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import {
  type FieldMetadata,
  type FieldRelationRollupMetadata,
} from '@/object-record/record-field/ui/types/FieldMetadata';

export const isFieldRelationRollup = (
  field: Pick<FieldDefinition<FieldMetadata>, 'metadata'>,
): field is FieldDefinition<FieldRelationRollupMetadata> => {
  return 'relationRollup' in field.metadata;
};
