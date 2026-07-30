import { Test, type TestingModule } from '@nestjs/testing';

import { ViewType } from 'twenty-shared/types';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { FlatViewFieldValidatorService } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/validators/services/flat-view-field-validator.service';

const LABEL_FIELD_UNIVERSAL_IDENTIFIER =
  '00000000-0000-0000-0000-0000000000a1';
const LABEL_VIEW_FIELD_UNIVERSAL_IDENTIFIER =
  '00000000-0000-0000-0000-0000000000b1';
const CUSTOM_VIEW_FIELD_UNIVERSAL_IDENTIFIER =
  '3171f12a-26b7-4420-ba15-c5cc2c990eda';
const VIEW_UNIVERSAL_IDENTIFIER = '00000000-0000-0000-0000-0000000000c1';
const OBJECT_UNIVERSAL_IDENTIFIER = '00000000-0000-0000-0000-0000000000d1';

const buildFlatViewField = (
  overrides: Partial<FlatViewField> = {},
): FlatViewField =>
  ({
    id: LABEL_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
    universalIdentifier: LABEL_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
    viewUniversalIdentifier: VIEW_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LABEL_FIELD_UNIVERSAL_IDENTIFIER,
    isVisible: true,
    position: 0,
    size: 100,
    deletedAt: null,
    workspaceId: 'workspace-id',
    applicationId: 'standard-app-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }) as unknown as FlatViewField;

const buildFlatView = (overrides: Partial<FlatView> = {}): FlatView =>
  ({
    id: VIEW_UNIVERSAL_IDENTIFIER,
    universalIdentifier: VIEW_UNIVERSAL_IDENTIFIER,
    objectMetadataUniversalIdentifier: OBJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.TABLE,
    viewFieldUniversalIdentifiers: [
      LABEL_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      CUSTOM_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
    ],
    workspaceId: 'workspace-id',
    applicationId: 'standard-app-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }) as unknown as FlatView;

const buildFlatObjectMetadata = (
  overrides: Partial<FlatObjectMetadata> = {},
): FlatObjectMetadata =>
  ({
    id: OBJECT_UNIVERSAL_IDENTIFIER,
    universalIdentifier: OBJECT_UNIVERSAL_IDENTIFIER,
    labelIdentifierFieldMetadataUniversalIdentifier:
      LABEL_FIELD_UNIVERSAL_IDENTIFIER,
    workspaceId: 'workspace-id',
    applicationId: 'standard-app-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }) as unknown as FlatObjectMetadata;

const addToMaps = <T extends { id: string; universalIdentifier: string }>(
  entity: T,
): FlatEntityMaps<T> =>
  ({
    ...createEmptyFlatEntityMaps(),
    byUniversalIdentifier: {
      [entity.universalIdentifier]: entity,
    },
    universalIdentifierById: {
      [entity.id]: entity.universalIdentifier,
    },
  }) as FlatEntityMaps<T>;

describe('FlatViewFieldValidatorService', () => {
  let service: FlatViewFieldValidatorService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [FlatViewFieldValidatorService],
    }).compile();

    service = moduleRef.get(FlatViewFieldValidatorService);
  });

  describe('validateFlatViewFieldUpdate', () => {
    it('should not throw when sibling custom view fields are missing from application-scoped maps', () => {
      const labelViewField = buildFlatViewField();
      const flatView = buildFlatView();
      const flatObjectMetadata = buildFlatObjectMetadata();

      const result = service.validateFlatViewFieldUpdate({
        universalIdentifier: LABEL_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
        flatEntityUpdate: {
          isVisible: true,
        },
        optimisticFlatEntityMapsAndRelatedFlatEntityMaps: {
          flatViewFieldMaps: addToMaps(labelViewField),
          flatViewMaps: addToMaps(flatView),
          flatObjectMetadataMaps: addToMaps(flatObjectMetadata),
        },
      } as never);

      expect(result.errors).toHaveLength(0);
    });
  });
});
