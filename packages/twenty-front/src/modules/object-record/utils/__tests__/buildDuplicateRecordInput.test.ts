import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildDuplicateRecordInput } from '@/object-record/utils/buildDuplicateRecordInput';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const metadata = {
  labelIdentifierFieldMetadataId: 'name',
  updatableFields: [
    { id: 'name', name: 'name', type: FieldMetadataType.TEXT },
    { name: 'id', type: FieldMetadataType.UUID },
    { name: 'createdAt', type: FieldMetadataType.DATE_TIME },
    { name: 'externalId', type: FieldMetadataType.TEXT, isUnique: true },
    { name: 'address', type: FieldMetadataType.ADDRESS },
    {
      name: 'company',
      type: FieldMetadataType.RELATION,
      relation: { type: RelationType.MANY_TO_ONE },
    },
    {
      name: 'people',
      type: FieldMetadataType.RELATION,
      relation: { type: RelationType.ONE_TO_MANY },
    },
    { name: 'files', type: FieldMetadataType.FILES },
  ],
} as EnrichedObjectMetadataItem;

describe('buildDuplicateRecordInput', () => {
  it('copies editable values and parent links, but not identity, unique values or child records', () => {
    const source = {
      __typename: 'Company',
      id: 'old',
      name: '기업',
      createdAt: '2026-01-01',
      externalId: 'unique',
      address: { __typename: 'Address', addressCity: '서울' },
      company: { id: 'parent' },
      people: [{ id: 'child' }],
      files: [{ fileId: 'file' }],
      hidden: 'not writable',
    };
    expect(buildDuplicateRecordInput(source, metadata)).toEqual({
      name: '기업 (복사본)',
      address: { addressCity: '서울' },
      companyId: 'parent',
    });
    expect(source.name).toBe('기업');
    expect(source.address.__typename).toBe('Address');
  });

  it('does not invent values for missing fields', () => {
    expect(
      buildDuplicateRecordInput({ id: 'old', __typename: 'Company' }, metadata),
    ).toEqual({});
  });
});
