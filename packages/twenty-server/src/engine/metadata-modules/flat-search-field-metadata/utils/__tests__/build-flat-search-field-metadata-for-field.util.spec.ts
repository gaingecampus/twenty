import { getSearchFieldUniversalIdentifier } from 'twenty-shared/application';

import { buildFlatSearchFieldMetadataForField } from 'src/engine/metadata-modules/flat-search-field-metadata/utils/build-flat-search-field-metadata-for-field.util';

const APPLICATION_UNIVERSAL_IDENTIFIER =
  '11111111-1111-4111-8111-111111111111';
const OBJECT_UNIVERSAL_IDENTIFIER =
  '22222222-2222-4222-8222-222222222222';
const FIELD_UNIVERSAL_IDENTIFIER = '33333333-3333-4333-8333-333333333333';

describe('buildFlatSearchFieldMetadataForField', () => {
  it('should use a deterministic universalIdentifier derived from the field', () => {
    const flatSearchFieldMetadata = buildFlatSearchFieldMetadataForField({
      flatObjectMetadata: {
        applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
        universalIdentifier: OBJECT_UNIVERSAL_IDENTIFIER,
      },
      flatFieldMetadata: {
        universalIdentifier: FIELD_UNIVERSAL_IDENTIFIER,
      },
      position: 0,
    });

    expect(flatSearchFieldMetadata.universalIdentifier).toBe(
      getSearchFieldUniversalIdentifier({
        applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
        fieldMetadataUniversalIdentifier: FIELD_UNIVERSAL_IDENTIFIER,
      }),
    );
    expect(flatSearchFieldMetadata.universalIdentifier).toBe(
      'db4e5b93-15b6-5c83-a0b3-6c031e0ca072',
    );
  });
});
