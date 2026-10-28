import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { buildIdentifierGqlFields } from '@/object-record/graphql/record-gql-fields/utils/buildIdentifierGqlFields';
import { FieldMetadataType } from 'twenty-shared/types';

const metadata = {
  nameSingular: 'messageList',
  labelIdentifierFieldMetadataId: 'name',
  imageIdentifierFieldMetadataId: null,
  fields: [
    { id: 'name', name: 'name', type: FieldMetadataType.TEXT },
  ] as FieldMetadataItem[],
};

it('loads saved avatar choices even when they are not visible table columns', () => {
  expect(
    buildIdentifierGqlFields({
      ...metadata,
      fields: [
        ...metadata.fields,
        { id: 'emoji', name: 'avatarEmoji', type: FieldMetadataType.TEXT },
        { id: 'color', name: 'avatarColor', type: FieldMetadataType.TEXT },
      ] as FieldMetadataItem[],
    }),
  ).toEqual({ id: true, name: true, avatarEmoji: true, avatarColor: true });
});

it('does not request avatar fields on objects without them', () => {
  expect(buildIdentifierGqlFields(metadata)).toEqual({ id: true, name: true });
});
