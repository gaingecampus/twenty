import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { type ColumnDefinition } from '@/object-record/record-table/types/ColumnDefinition';
import { isDefined } from 'twenty-shared/utils';

export const getFieldDefinitionForRecordField = ({
  recordField,
  fieldDefinitionByViewFieldId,
  fieldDefinitionByFieldMetadataItemId,
}: {
  recordField: RecordField;
  fieldDefinitionByViewFieldId: Record<
    string,
    ColumnDefinition<FieldMetadata>
  >;
  fieldDefinitionByFieldMetadataItemId: Record<
    string,
    ColumnDefinition<FieldMetadata>
  >;
}): ColumnDefinition<FieldMetadata> | undefined => {
  const fieldDefinitionFromViewField =
    fieldDefinitionByViewFieldId[recordField.id];

  if (isDefined(fieldDefinitionFromViewField)) {
    return fieldDefinitionFromViewField;
  }

  return fieldDefinitionByFieldMetadataItemId[recordField.fieldMetadataItemId];
};
