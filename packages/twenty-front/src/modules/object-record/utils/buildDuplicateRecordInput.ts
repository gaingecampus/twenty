import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const OMITTED_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'position',
]);

const cleanValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '__typename')
        .map(([key, item]) => [key, cleanValue(item)]),
    );
  }
  return value;
};

export const buildDuplicateRecordInput = (
  record: ObjectRecord,
  metadata: EnrichedObjectMetadataItem,
): Partial<ObjectRecord> => {
  const input: Partial<ObjectRecord> = {};
  for (const field of metadata.updatableFields) {
    if (
      OMITTED_FIELDS.has(field.name) ||
      field.isUnique ||
      field.isActive === false ||
      field.isUIEditable === false ||
      field.type === FieldMetadataType.ACTOR ||
      field.type === FieldMetadataType.MORPH_RELATION ||
      field.type === FieldMetadataType.FILES
    )
      continue;
    if (field.type === FieldMetadataType.RELATION) {
      if (field.relation?.type === RelationType.MANY_TO_ONE) {
        const id = record[`${field.name}Id`] ?? record[field.name]?.id;
        if (typeof id === 'string') input[`${field.name}Id`] = id;
      }
      continue;
    }
    if (record[field.name] !== undefined)
      input[field.name] = cleanValue(record[field.name]);
    if (
      field.id === metadata.labelIdentifierFieldMetadataId &&
      typeof input[field.name] === 'string'
    ) {
      input[field.name] = `${input[field.name]} (복사본)`;
    }
  }
  return input;
};
