import { Test, type TestingModule } from '@nestjs/testing';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { RelatedPersonIdsService } from 'src/engine/core-modules/related-person-ids/services/related-person-ids.service';
import { findRelationPathsToPerson } from 'src/engine/core-modules/related-person-ids/utils/find-relation-paths-to-person.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

jest.mock(
  'src/engine/core-modules/related-person-ids/utils/find-relation-paths-to-person.util',
  () => ({
    findRelationPathsToPerson: jest.fn(),
  }),
);

const findRelationPathsToPersonMock = jest.mocked(findRelationPathsToPerson);

describe('RelatedPersonIdsService', () => {
  let service: RelatedPersonIdsService;
  let mockGlobalWorkspaceOrmManager: {
    getRepository: jest.Mock;
    executeInWorkspaceContext: jest.Mock;
  };
  let mockWorkspaceCacheService: {
    getOrRecompute: jest.Mock;
  };

  const workspaceId = 'workspace-id';
  const companyId = 'company-id';
  const opportunityId = 'opportunity-id';

  beforeEach(async () => {
    mockGlobalWorkspaceOrmManager = {
      getRepository: jest.fn(),
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation(async (callback: () => Promise<unknown>) =>
          callback(),
        ),
    };

    mockWorkspaceCacheService = {
      getOrRecompute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatedPersonIdsService,
        {
          provide: GlobalWorkspaceOrmManager,
          useValue: mockGlobalWorkspaceOrmManager,
        },
        {
          provide: WorkspaceCacheService,
          useValue: mockWorkspaceCacheService,
        },
      ],
    }).compile();

    service = module.get(RelatedPersonIdsService);

    jest.clearAllMocks();
    mockGlobalWorkspaceOrmManager.executeInWorkspaceContext.mockImplementation(
      async (callback: () => Promise<unknown>) => callback(),
    );
  });

  describe('getRelatedPersonIds', () => {
    it('should return the record id when the target object is a person', async () => {
      const personId = 'person-id';

      const result = await service.getRelatedPersonIds({
        workspaceId,
        objectNameSingular: 'person',
        recordId: personId,
      });

      expect(result).toEqual([personId]);
      expect(
        mockGlobalWorkspaceOrmManager.executeInWorkspaceContext,
      ).not.toHaveBeenCalled();
      expect(mockWorkspaceCacheService.getOrRecompute).not.toHaveBeenCalled();
    });

    it('should return only people linked via companyId for company records', async () => {
      const personRepository = {
        find: jest.fn().mockResolvedValue([
          { id: 'person-1' },
          { id: 'person-2' },
        ]),
      };

      mockGlobalWorkspaceOrmManager.getRepository.mockResolvedValue(
        personRepository,
      );

      const result = await service.getRelatedPersonIds({
        workspaceId,
        objectNameSingular: 'company',
        recordId: companyId,
      });

      expect(result).toEqual(['person-1', 'person-2']);
      expect(mockGlobalWorkspaceOrmManager.getRepository).toHaveBeenCalledWith(
        workspaceId,
        'person',
        { shouldBypassPermissionChecks: true },
      );
      expect(personRepository.find).toHaveBeenCalledWith({
        where: { companyId },
        select: { id: true },
      });
      expect(mockWorkspaceCacheService.getOrRecompute).not.toHaveBeenCalled();
      expect(findRelationPathsToPersonMock).not.toHaveBeenCalled();
    });

    it('should return an empty list when the company has no linked people', async () => {
      const personRepository = {
        find: jest.fn().mockResolvedValue([]),
      };

      mockGlobalWorkspaceOrmManager.getRepository.mockResolvedValue(
        personRepository,
      );

      const result = await service.getRelatedPersonIds({
        workspaceId,
        objectNameSingular: 'company',
        recordId: companyId,
      });

      expect(result).toEqual([]);
    });

    it('should walk relation paths for opportunity including POC and company people', async () => {
      findRelationPathsToPersonMock.mockReturnValue([
        [
          {
            direction: RelationType.MANY_TO_ONE,
            queryObjectNameSingular: 'opportunity',
            joinColumnName: 'pointOfContactId',
          },
        ],
        [
          {
            direction: RelationType.MANY_TO_ONE,
            queryObjectNameSingular: 'opportunity',
            joinColumnName: 'companyId',
          },
          {
            direction: RelationType.ONE_TO_MANY,
            queryObjectNameSingular: 'person',
            joinColumnName: 'companyId',
          },
        ],
      ]);

      mockWorkspaceCacheService.getOrRecompute.mockResolvedValue({
        flatObjectMetadataMaps: {},
        flatFieldMetadataMaps: {},
      });

      const opportunityRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            { pointOfContactId: 'poc-person-id' },
          ])
          .mockResolvedValueOnce([{ companyId }]),
      };
      const personRepository = {
        find: jest.fn().mockResolvedValue([
          { id: 'company-person-1' },
          { id: 'company-person-2' },
        ]),
      };

      mockGlobalWorkspaceOrmManager.getRepository.mockImplementation(
        async (_workspaceId: string, objectNameSingular: string) => {
          if (objectNameSingular === 'opportunity') {
            return opportunityRepository;
          }

          if (objectNameSingular === 'person') {
            return personRepository;
          }

          throw new Error(`Unexpected object: ${objectNameSingular}`);
        },
      );

      const result = await service.getRelatedPersonIds({
        workspaceId,
        objectNameSingular: 'opportunity',
        recordId: opportunityId,
      });

      expect(result).toEqual(
        expect.arrayContaining([
          'poc-person-id',
          'company-person-1',
          'company-person-2',
        ]),
      );
      expect(result).toHaveLength(3);
      expect(findRelationPathsToPersonMock).toHaveBeenCalled();
      expect(mockWorkspaceCacheService.getOrRecompute).toHaveBeenCalled();
    });
  });
});
