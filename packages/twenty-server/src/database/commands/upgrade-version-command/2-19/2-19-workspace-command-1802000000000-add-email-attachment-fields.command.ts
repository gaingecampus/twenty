import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const ATTACHMENT_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.attachment.fields.targetMessage.universalIdentifier,
  STANDARD_OBJECTS.attachment.fields.emailExternalAttachmentId
    .universalIdentifier,
  STANDARD_OBJECTS.attachment.fields.attachmentKind.universalIdentifier,
  STANDARD_OBJECTS.attachment.fields.externalUrl.universalIdentifier,
];

const MESSAGE_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.message.fields.attachments.universalIdentifier,
];

const ATTACHMENT_INDEX_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.attachment.indexes.messageIdIndex.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.19.0', 1802000000000)
@Command({
  name: 'upgrade:2-19:add-email-attachment-fields',
  description:
    'Add email attachment fields to attachment and message standard objects for persisting email files on person records.',
})
export class AddEmailAttachmentFieldsCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const { flatFieldMetadataMaps, flatIndexMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
        'flatIndexMaps',
      ]);

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const flatFieldMetadataToCreate = [
      ...ATTACHMENT_FIELD_UNIVERSAL_IDENTIFIERS,
      ...MESSAGE_FIELD_UNIVERSAL_IDENTIFIERS,
    ].flatMap((universalIdentifier) =>
      getStandardFlatEntitiesToCreateOrThrow<FlatFieldMetadata>({
        standardFlatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
        existingFlatEntityMaps: flatFieldMetadataMaps,
        universalIdentifiers: [universalIdentifier],
      }),
    );

    const flatIndexMetadataToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatIndexMetadata>({
        standardFlatEntityMaps: standardAllFlatEntityMaps.flatIndexMaps,
        existingFlatEntityMaps: flatIndexMaps,
        universalIdentifiers: ATTACHMENT_INDEX_UNIVERSAL_IDENTIFIERS,
      });

    if (
      flatFieldMetadataToCreate.length === 0 &&
      flatIndexMetadataToCreate.length === 0
    ) {
      this.logger.log(
        `Email attachment fields already present for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would create ${flatFieldMetadataToCreate.length} field(s) and ${flatIndexMetadataToCreate.length} index(es) for workspace ${workspaceId}`,
      );

      return;
    }

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: flatFieldMetadataToCreate.map(
                (flatFieldMetadata) => ({
                  ...flatFieldMetadata,
                  viewFieldIds: [],
                  viewFieldUniversalIdentifiers: [],
                }),
              ),
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            index: {
              flatEntityToCreate: flatIndexMetadataToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
          workspaceId,
          isSystemBuild: true,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      this.logger.error(
        `Failed to add email attachment fields for workspace ${workspaceId}:\n${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );

      throw new Error(
        `Failed to add email attachment fields for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Added email attachment fields for workspace ${workspaceId}`,
    );
  }
}
