import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getAvatarUrl } from '@/object-metadata/utils/getAvatarUrl';
import { getAvatarType } from '@/object-metadata/utils/getAvatarType';
import { buildIdentifierGqlFields } from '@/object-record/graphql/record-gql-fields/utils/buildIdentifierGqlFields';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { getLogoUrlFromDomainName } from 'twenty-shared/utils';

const fields = [
  {
    id: 'company-relation',
    name: 'linkedCompany',
    type: FieldMetadataType.RELATION,
    relation: {
      type: RelationType.MANY_TO_ONE,
      targetObjectMetadata: { nameSingular: 'company' },
    },
  },
] as FieldMetadataItem[];

describe('linked company avatar', () => {
  it('prefers the primary company relation regardless of metadata order', () => {
    const duplicateFields = [
      { ...fields[0], name: 'gyeyagGieob' },
      { ...fields[0], id: 'primary-company', name: 'company' },
    ];
    expect(
      buildIdentifierGqlFields({
        fields: duplicateFields,
        nameSingular: 'onboarding',
        labelIdentifierFieldMetadataId: 'name',
        imageIdentifierFieldMetadataId: null,
      }),
    ).toMatchObject({ company: { id: true, domainName: true } });
    expect(
      getAvatarUrl(
        'onboarding',
        {
          id: 'contract',
          __typename: 'Onboarding',
          gyeyagGieob: null,
          company: { domainName: { primaryLinkUrl: 'https://stripe.com' } },
        },
        undefined,
        true,
        duplicateFields,
      ),
    ).toBe(getLogoUrlFromDomainName('https://stripe.com'));
  });
  it.each(['opportunity', 'onboarding', 'deposit'])(
    'uses the company favicon for %s with a customized relation name',
    (objectNameSingular) => {
      expect(getAvatarType(objectNameSingular)).toBe('squared');
      expect(
        getAvatarUrl(
          objectNameSingular,
          {
            id: 'record',
            __typename: 'Record',
            linkedCompany: {
              id: 'company',
              domainName: { primaryLinkUrl: 'https://gainge.com' },
            },
          },
          undefined,
          true,
          fields,
        ),
      ).toBe(getLogoUrlFromDomainName('https://gainge.com'));

      expect(
        buildIdentifierGqlFields({
          fields,
          nameSingular: objectNameSingular,
          labelIdentifierFieldMetadataId: 'name',
          imageIdentifierFieldMetadataId: null,
        }),
      ).toMatchObject({ linkedCompany: { id: true, domainName: true } });
    },
  );

  it('supports legacy string domains', () => {
    expect(
      getAvatarUrl(
        'deposit',
        {
          id: 'record',
          __typename: 'Deposit',
          linkedCompany: { domainName: 'gainge.com' },
        },
        undefined,
        true,
        fields,
      ),
    ).toBe(getLogoUrlFromDomainName('gainge.com'));
  });

  it.each([undefined, null, { domainName: null }])(
    'keeps the fallback when the company has no usable domain: %s',
    (linkedCompany) => {
      expect(
        getAvatarUrl(
          'opportunity',
          { id: 'record', __typename: 'Opportunity', linkedCompany },
          undefined,
          true,
          fields,
        ),
      ).toBe('');
    },
  );

  it('respects the external icon request setting', () => {
    expect(
      getAvatarUrl(
        'onboarding',
        {
          id: 'record',
          __typename: 'Onboarding',
          linkedCompany: { domainName: 'gainge.com' },
        },
        undefined,
        false,
        fields,
      ),
    ).toBe('');
  });

  it('does not change avatars for unrelated objects', () => {
    expect(
      getAvatarUrl(
        'task',
        {
          id: 'record',
          __typename: 'Task',
          linkedCompany: { domainName: 'gainge.com' },
        },
        undefined,
        true,
        fields,
      ),
    ).toBe('');
  });
});
