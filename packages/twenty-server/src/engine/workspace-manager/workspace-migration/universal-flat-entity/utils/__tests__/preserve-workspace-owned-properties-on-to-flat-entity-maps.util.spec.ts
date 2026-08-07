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

  it('should preserve SELECT field options and defaultValue from from-maps', () => {
    const universalIdentifier = 'stage-field-universal-identifier';
    const workspaceOptions = [
      {
        id: 'option-new-id',
        value: 'NEW',
        label: '신규 문의',
        position: 0,
        color: 'blue',
      },
      {
        id: 'option-won-id',
        value: 'WON',
        label: '성사',
        position: 1,
        color: 'green',
      },
    ];
    const fromFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.SELECT,
      universalIdentifier,
      defaultValue: "'NEW'",
      options: workspaceOptions,
    });
    const toFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.SELECT,
      universalIdentifier,
      defaultValue: "'SCREENING'",
      options: [
        {
          id: 'standard-option-new-id',
          value: 'NEW',
          label: 'New',
          position: 0,
          color: 'red',
        },
        {
          id: 'standard-option-screening-id',
          value: 'SCREENING',
          label: 'Screening',
          position: 1,
          color: 'purple',
        },
      ],
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

    expect(result.byUniversalIdentifier[universalIdentifier]?.options).toEqual(
      workspaceOptions,
    );
    expect(
      result.byUniversalIdentifier[universalIdentifier]?.defaultValue,
    ).toBe("'NEW'");
  });

  it('should preserve viewGroup position and isVisible from from-maps', () => {
    const universalIdentifier = 'view-group-universal-identifier';
    const fromFlatEntity = {
      universalIdentifier,
      fieldValue: 'NEW',
      position: 3,
      isVisible: false,
    };
    const toFlatEntity = {
      universalIdentifier,
      fieldValue: 'NEW',
      position: 0,
      isVisible: true,
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
      fieldValue: 'NEW',
      position: 3,
      isVisible: false,
    });
  });

  it('should preserve navigationMenuItem sidebar customizations from from-maps', () => {
    const universalIdentifier = 'nav-item-universal-identifier';
    const fromFlatEntity = {
      universalIdentifier,
      type: 'VIEW',
      position: 5,
      folderId: 'workspace-folder-id',
      folderUniversalIdentifier: 'workspace-folder-universal-id',
      name: '거래처',
      icon: 'IconBuilding',
      color: 'blue',
      link: null,
    };
    const toFlatEntity = {
      universalIdentifier,
      type: 'VIEW',
      position: 1,
      folderId: null,
      folderUniversalIdentifier: null,
      name: 'Companies',
      icon: 'IconBuildingSkyscraper',
      color: null,
      link: null,
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
      metadataName: 'navigationMenuItem',
    });

    expect(result.byUniversalIdentifier[universalIdentifier]).toEqual({
      ...toFlatEntity,
      position: 5,
      folderId: 'workspace-folder-id',
      folderUniversalIdentifier: 'workspace-folder-universal-id',
      name: '거래처',
      icon: 'IconBuilding',
      color: 'blue',
    });
  });

  it('should not preserve fieldMetadata base icon without navigation scope', () => {
    const universalIdentifier = 'field-universal-identifier';
    const fromFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.TEXT,
      universalIdentifier,
      icon: 'IconWorkspace',
    });
    const toFlatEntity = getFlatFieldMetadataMock({
      objectMetadataId: 'object-metadata-id',
      type: FieldMetadataType.TEXT,
      universalIdentifier,
      icon: 'IconCode',
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
      metadataName: 'fieldMetadata',
    });

    expect(result.byUniversalIdentifier[universalIdentifier]?.icon).toBe(
      'IconCode',
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
