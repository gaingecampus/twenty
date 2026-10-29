import { Test } from '@nestjs/testing';
import { getSearchFieldUniversalIdentifier } from 'twenty-shared/application';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { NormalizeSearchFieldMetadataUniversalIdentifiersCommand } from 'src/database/commands/upgrade-version-command/2-19/2-19-workspace-command-1802000000001-normalize-search-field-metadata-universal-identifiers.command';
import { SearchFieldMetadataEntity } from 'src/engine/metadata-modules/search-field-metadata/search-field-metadata.entity';
import { WorkspaceMetadataVersionService } from 'src/engine/metadata-modules/workspace-metadata-version/services/workspace-metadata-version.service';
import { getWorkspaceScopedRepositoryToken } from 'src/engine/twenty-orm/workspace-scoped-repository/get-workspace-scoped-repository-token.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

describe('NormalizeSearchFieldMetadataUniversalIdentifiersCommand', () => {
  const applicationUniversalIdentifier = '6ad7fbcf-dd2e-49ea-b921-3509f67f521e';
  const fieldMetadataUniversalIdentifier = 'field-identifier';
  const update = jest.fn();
  const invalidateAndRecompute = jest.fn();
  const incrementMetadataVersion = jest.fn();
  let command: NormalizeSearchFieldMetadataUniversalIdentifiersCommand;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        NormalizeSearchFieldMetadataUniversalIdentifiersCommand,
        { provide: WorkspaceIteratorService, useValue: {} },
        {
          provide: WorkspaceCacheService,
          useValue: {
            getOrRecompute: jest.fn().mockResolvedValue({
              flatSearchFieldMetadataMaps: {
                byUniversalIdentifier: {
                  legacy: {
                    id: 'search-field',
                    universalIdentifier: 'legacy',
                    applicationUniversalIdentifier,
                    fieldMetadataUniversalIdentifier,
                  },
                },
              },
            }),
            invalidateAndRecompute,
          },
        },
        {
          provide: WorkspaceMetadataVersionService,
          useValue: { incrementMetadataVersion },
        },
        {
          provide: getWorkspaceScopedRepositoryToken(SearchFieldMetadataEntity),
          useValue: { update },
        },
      ],
    }).compile();
    command = module.get(
      NormalizeSearchFieldMetadataUniversalIdentifiersCommand,
    );
  });

  it('passes the workspace boundary to the repository and invalidates the same workspace', async () => {
    await command.runOnWorkspace({
      workspaceId: 'workspace',
      options: {},
      index: 0,
      total: 1,
    });
    expect(update).toHaveBeenCalledWith(
      'workspace',
      { id: 'search-field' },
      {
        universalIdentifier: getSearchFieldUniversalIdentifier({
          applicationUniversalIdentifier,
          fieldMetadataUniversalIdentifier,
        }),
      },
    );
    expect(incrementMetadataVersion).toHaveBeenCalledWith('workspace');
    expect(invalidateAndRecompute).toHaveBeenCalledWith('workspace', [
      'flatSearchFieldMetadataMaps',
      'flatObjectMetadataMaps',
    ]);
  });

  it('does not write or invalidate metadata during a dry run', async () => {
    await command.runOnWorkspace({
      workspaceId: 'workspace',
      options: { dryRun: true },
      index: 0,
      total: 1,
    });
    expect(update).not.toHaveBeenCalled();
    expect(incrementMetadataVersion).not.toHaveBeenCalled();
    expect(invalidateAndRecompute).not.toHaveBeenCalled();
  });
});
