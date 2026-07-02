import { Command } from 'nest-commander';

import { InjectRepository } from '@nestjs/typeorm';
import { getSearchFieldUniversalIdentifier } from 'twenty-shared/application';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatSearchFieldMetadata } from 'src/engine/metadata-modules/flat-search-field-metadata/types/flat-search-field-metadata.type';
import { SearchFieldMetadataEntity } from 'src/engine/metadata-modules/search-field-metadata/search-field-metadata.entity';
import { WorkspaceMetadataVersionService } from 'src/engine/metadata-modules/workspace-metadata-version/services/workspace-metadata-version.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@RegisteredWorkspaceCommand('2.19.0', 1802000000001)
@Command({
  name: 'upgrade:2-19:normalize-search-field-metadata-universal-identifiers',
  description:
    'Rewrite legacy random searchFieldMetadata universalIdentifiers to deterministic values so twenty-standard sync can reconcile metadata.',
})
export class NormalizeSearchFieldMetadataUniversalIdentifiersCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMetadataVersionService: WorkspaceMetadataVersionService,
    @InjectRepository(SearchFieldMetadataEntity)
    private readonly searchFieldMetadataRepository: Repository<SearchFieldMetadataEntity>,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const { flatSearchFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatSearchFieldMetadataMaps',
      ]);

    const searchFieldMetadataRowsToNormalize = Object.values(
      flatSearchFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .flatMap((flatSearchFieldMetadata) => {
        const deterministicUniversalIdentifier =
          this.getDeterministicUniversalIdentifier(flatSearchFieldMetadata);

        if (
          flatSearchFieldMetadata.universalIdentifier ===
          deterministicUniversalIdentifier
        ) {
          return [];
        }

        return [
          {
            flatSearchFieldMetadata,
            deterministicUniversalIdentifier,
          },
        ];
      });

    if (searchFieldMetadataRowsToNormalize.length === 0) {
      this.logger.log(
        `searchFieldMetadata universalIdentifiers already normalized for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Normalizing ${searchFieldMetadataRowsToNormalize.length} searchFieldMetadata universalIdentifier(s) for workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    for (const {
      flatSearchFieldMetadata,
      deterministicUniversalIdentifier,
    } of searchFieldMetadataRowsToNormalize) {
      await this.searchFieldMetadataRepository.update(
        {
          id: flatSearchFieldMetadata.id,
          workspaceId,
        },
        {
          universalIdentifier: deterministicUniversalIdentifier,
        },
      );
    }

    await this.workspaceMetadataVersionService.incrementMetadataVersion(
      workspaceId,
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatSearchFieldMetadataMaps',
      'flatObjectMetadataMaps',
    ]);

    this.logger.log(
      `Normalized ${searchFieldMetadataRowsToNormalize.length} searchFieldMetadata universalIdentifier(s) for workspace ${workspaceId}`,
    );
  }

  private getDeterministicUniversalIdentifier(
    flatSearchFieldMetadata: FlatSearchFieldMetadata,
  ): string {
    return getSearchFieldUniversalIdentifier({
      applicationUniversalIdentifier:
        flatSearchFieldMetadata.applicationUniversalIdentifier,
      fieldMetadataUniversalIdentifier:
        flatSearchFieldMetadata.fieldMetadataUniversalIdentifier,
    });
  }
}
