import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from 'twenty-shared/types';
import {
  computeRelationGqlFieldJoinColumnName,
  isDefined,
} from 'twenty-shared/utils';

// Prefer persisted joinColumnName; fall back to the GraphQL convention (*Id).
export const getRelationJoinColumnName = (
  field: Pick<FieldMetadataItem, 'name' | 'type' | 'settings'>,
  computedFieldName?: string,
): string | undefined => {
  const settings = field.settings;

  if (
    isDefined(settings) &&
    typeof settings === 'object' &&
    'joinColumnName' in settings &&
    typeof settings.joinColumnName === 'string' &&
    settings.joinColumnName.length > 0
  ) {
    return settings.joinColumnName;
  }

  const fieldNameForJoinColumn = computedFieldName ?? field.name;

  if (
    field.type !== FieldMetadataType.RELATION &&
    field.type !== FieldMetadataType.MORPH_RELATION
  ) {
    return undefined;
  }

  return computeRelationGqlFieldJoinColumnName({
    name: fieldNameForJoinColumn,
  });
};
