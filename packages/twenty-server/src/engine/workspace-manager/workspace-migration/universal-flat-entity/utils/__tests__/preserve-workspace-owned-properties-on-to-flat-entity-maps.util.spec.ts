import { FieldMetadataType } from 'twenty-shared/types';

import { getFlatFieldMetadataMock } from 'src/engine/metadata-modules/flat-field-metadata/__mocks__/get-flat-field-metadata.mock';
import { preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/preserve-workspace-owned-properties-on-to-flat-entity-maps.util';

describe('preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps', () => {
  it('should copy standardOverrides from from-maps onto matching to entities', () => {
    const universalIdentifier = 'field-universal-identifier';
    const fromFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.TEXT,
      universalIdentifier,
      standardOverrides: {
        label: 'Custom label',
        icon: 'IconCustom',
      },
    });
    const toFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.TEXT,
      universalIdentifier,
      standardOverrides: null,
      label: 'Name',
      icon: 'IconAbc',
    });

    const result = preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps({
      fromFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: fromFlatEntity,
        },
      },
      toFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: toFlatEntity,
        },
      },
    });

    expect(
      result.byUniversalIdentifier[universalIdentifier]?.standardOverrides,
    ).toEqual({
      label: 'Custom label',
      icon: 'IconCustom',
    });
    expect(result.byUniversalIdentifier[universalIdentifier]?.label).toBe(
      'Name',
    );
    expect(result.byUniversalIdentifier[universalIdentifier]?.icon).toBe(
      'IconAbc',
    );
  });

  it('should copy overrides and universalOverrides from from-maps', () => {
    const universalIdentifier = 'view-universal-identifier';
    const fromFlatEntity = {
      universalIdentifier,
      name: 'All Companies',
      icon: 'IconList',
      overrides: {
        name: '전체 거래처',
        icon: 'IconBuilding',
      },
      universalOverrides: {
        name: '전체 거래처',
        icon: 'IconBuilding',
      },
    };
    const toFlatEntity = {
      universalIdentifier,
      name: 'All Companies',
      icon: 'IconList',
      overrides: null,
      universalOverrides: null,
    };

    const result = preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps({
      fromFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: fromFlatEntity,
        },
      },
      toFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: toFlatEntity,
        },
      },
    });

    expect(result.byUniversalIdentifier[universalIdentifier]).toEqual({
      universalIdentifier,
      name: 'All Companies',
      icon: 'IconList',
      overrides: {
        name: '전체 거래처',
        icon: 'IconBuilding',
      },
      universalOverrides: {
        name: '전체 거래처',
        icon: 'IconBuilding',
      },
    });
  });

  it('should leave to entities unchanged when from has no matching entity', () => {
    const toFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.TEXT,
      universalIdentifier: 'new-field-universal-identifier',
      standardOverrides: null,
    });

    const result = preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps({
      fromFlatEntityMaps: {
        byUniversalIdentifier: {},
      },
      toFlatEntityMaps: {
        byUniversalIdentifier: {
          [toFlatEntity.universalIdentifier]: toFlatEntity,
        },
      },
    });

    expect(result.byUniversalIdentifier[toFlatEntity.universalIdentifier]).toBe(
      toFlatEntity,
    );
  });

  it('should not mutate the original to flat entity maps object', () => {
    const universalIdentifier = 'field-universal-identifier';
    const fromFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.TEXT,
      universalIdentifier,
      standardOverrides: { label: 'Custom' },
    });
    const toFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.TEXT,
      universalIdentifier,
      standardOverrides: null,
    });
    const toFlatEntityMaps = {
      byUniversalIdentifier: {
        [universalIdentifier]: toFlatEntity,
      },
    };

    preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps({
      fromFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: fromFlatEntity,
        },
      },
      toFlatEntityMaps,
    });

    expect(
      toFlatEntityMaps.byUniversalIdentifier[universalIdentifier]
        ?.standardOverrides,
    ).toBeNull();
  });

  it('should preserve deactivated isActive from from-maps', () => {
    const universalIdentifier = 'view-universal-identifier';
    const fromFlatEntity = {
      universalIdentifier,
      isActive: false,
      overrides: null,
      universalOverrides: null,
    };
    const toFlatEntity = {
      universalIdentifier,
      isActive: true,
      overrides: null,
      universalOverrides: null,
    };

    const result = preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps({
      fromFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: fromFlatEntity,
        },
      },
      toFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: toFlatEntity,
        },
      },
    });

    expect(result.byUniversalIdentifier[universalIdentifier]?.isActive).toBe(
      false,
    );
  });

  it('should preserve page layout widget configuration and gridPosition', () => {
    const universalIdentifier = 'widget-universal-identifier';
    const fromConfiguration = {
      configurationType: 'FIELDS',
      fieldMetadataIds: ['custom-field-id'],
    };
    const fromUniversalConfiguration = {
      configurationType: 'FIELDS',
      fieldMetadataUniversalIdentifiers: ['custom-field-universal-id'],
    };
    const fromGridPosition = { row: 2, column: 1, rowSpan: 4, columnSpan: 6 };
    const fromFlatEntity = {
      universalIdentifier,
      isActive: true,
      configuration: fromConfiguration,
      universalConfiguration: fromUniversalConfiguration,
      gridPosition: fromGridPosition,
      overrides: null,
      universalOverrides: null,
    };
    const toFlatEntity = {
      universalIdentifier,
      isActive: true,
      configuration: {
        configurationType: 'FIELDS',
        fieldMetadataIds: ['standard-field-id'],
      },
      universalConfiguration: {
        configurationType: 'FIELDS',
        fieldMetadataUniversalIdentifiers: ['standard-field-universal-id'],
      },
      gridPosition: { row: 0, column: 0, rowSpan: 2, columnSpan: 6 },
      overrides: null,
      universalOverrides: null,
    };

    const result = preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps({
      fromFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: fromFlatEntity,
        },
      },
      toFlatEntityMaps: {
        byUniversalIdentifier: {
          [universalIdentifier]: toFlatEntity,
        },
      },
    });

    expect(result.byUniversalIdentifier[universalIdentifier]).toEqual({
      ...toFlatEntity,
      configuration: fromConfiguration,
      universalConfiguration: fromUniversalConfiguration,
      gridPosition: fromGridPosition,
    });
  });
});
