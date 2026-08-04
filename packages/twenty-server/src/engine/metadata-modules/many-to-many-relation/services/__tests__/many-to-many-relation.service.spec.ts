import { Test } from '@nestjs/testing';

import { FeatureFlagKey } from 'twenty-shared/types';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import {
  FieldMetadataException,
  FieldMetadataExceptionCode,
} from 'src/engine/metadata-modules/field-metadata/field-metadata.exception';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { IndexMetadataService } from 'src/engine/metadata-modules/index-metadata/services/index-metadata.service';
import { ManyToManyRelationService } from 'src/engine/metadata-modules/many-to-many-relation/services/many-to-many-relation.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

describe('ManyToManyRelationService', () => {
  let service: ManyToManyRelationService;
  let featureFlagService: { isFeatureEnabled: jest.Mock };
  let flatEntityMapsCacheService: {
    getOrRecomputeManyOrAllFlatEntityMaps: jest.Mock;
  };

  const workspaceId = 'workspace-id';
  const sourceObjectId = 'source-object-id';
  const targetObjectId = 'target-object-id';

  beforeEach(async () => {
    featureFlagService = {
      isFeatureEnabled: jest.fn(),
    };
    flatEntityMapsCacheService = {
      getOrRecomputeManyOrAllFlatEntityMaps: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ManyToManyRelationService,
        { provide: FeatureFlagService, useValue: featureFlagService },
        { provide: ObjectMetadataService, useValue: {} },
        { provide: FieldMetadataService, useValue: {} },
        { provide: IndexMetadataService, useValue: {} },
        {
          provide: WorkspaceManyOrAllFlatEntityMapsCacheService,
          useValue: flatEntityMapsCacheService,
        },
        { provide: ApplicationService, useValue: {} },
        {
          provide: WorkspaceMigrationValidateBuildAndRunService,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get(ManyToManyRelationService);
  });

  it('should throw when junction relations feature flag is disabled', async () => {
    featureFlagService.isFeatureEnabled.mockResolvedValue(false);

    await expect(
      service.createManyToManyRelation({
        workspaceId,
        input: {
          sourceObjectMetadataId: sourceObjectId,
          targetObjectMetadataId: targetObjectId,
          sourceFieldLabel: 'Members',
          targetFieldLabel: 'Companies',
        },
      }),
    ).rejects.toMatchObject({
      code: FieldMetadataExceptionCode.FIELD_METADATA_RELATION_NOT_ENABLED,
    });

    expect(featureFlagService.isFeatureEnabled).toHaveBeenCalledWith(
      FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED,
      workspaceId,
    );
  });

  it('should throw when source and target objects are the same', async () => {
    featureFlagService.isFeatureEnabled.mockResolvedValue(true);

    await expect(
      service.createManyToManyRelation({
        workspaceId,
        input: {
          sourceObjectMetadataId: sourceObjectId,
          targetObjectMetadataId: sourceObjectId,
          sourceFieldLabel: 'Related',
          targetFieldLabel: 'Related',
        },
      }),
    ).rejects.toBeInstanceOf(FieldMetadataException);

    await expect(
      service.createManyToManyRelation({
        workspaceId,
        input: {
          sourceObjectMetadataId: sourceObjectId,
          targetObjectMetadataId: sourceObjectId,
          sourceFieldLabel: 'Related',
          targetFieldLabel: 'Related',
        },
      }),
    ).rejects.toMatchObject({
      code: FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
    });
  });
});
