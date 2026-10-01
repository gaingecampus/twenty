import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getAvatarUrl } from '@/object-metadata/utils/getAvatarUrl';
import { buildIdentifierGqlFields } from '@/object-record/graphql/record-gql-fields/utils/buildIdentifierGqlFields';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const fields = [
  {
    id: 'linked',
    name: 'linkedUser',
    type: FieldMetadataType.RELATION,
    relation: {
      type: RelationType.MANY_TO_ONE,
      targetObjectMetadata: { nameSingular: 'workspaceMember' },
    },
  },
] as FieldMetadataItem[];

describe('linked member avatar', () => {
  it('uses the linked workspace member photo even when the relation name is customized', () => {
    expect(
      getAvatarUrl(
        'member',
        { id: 'record', __typename: 'Member', linkedUserId: 'user' },
        undefined,
        false,
        fields,
        [{ id: 'user', avatarUrl: '/photo.png' }],
      ),
    ).toBe('/photo.png');
  });
  it('uses a loaded relationship when the member directory is not available', () => {
    expect(
      getAvatarUrl(
        'member',
        {
          id: 'record',
          __typename: 'Member',
          linkedUser: { id: 'user', avatarUrl: '/photo.png' },
        },
        undefined,
        false,
        fields,
      ),
    ).toBe('/photo.png');
  });
  it('does not use an unrelated workspace member photo', () => {
    expect(
      getAvatarUrl(
        'member',
        { id: 'record', __typename: 'Member' },
        undefined,
        false,
        fields,
        [{ id: 'user', avatarUrl: '/photo.png' }],
      ),
    ).toBe('');
  });
  it('loads the linked member ID when requesting relation chips', () => {
    expect(
      buildIdentifierGqlFields({
        fields,
        nameSingular: 'member',
        labelIdentifierFieldMetadataId: 'name',
        imageIdentifierFieldMetadataId: null,
      }),
    ).toMatchObject({ linkedUserId: true });
  });
});
