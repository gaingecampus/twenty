import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { AddEmailAttachmentFieldsCommand } from 'src/database/commands/upgrade-version-command/2-19/2-19-workspace-command-1802000000000-add-email-attachment-fields.command';
import { NormalizeSearchFieldMetadataUniversalIdentifiersCommand } from 'src/database/commands/upgrade-version-command/2-19/2-19-workspace-command-1802000000001-normalize-search-field-metadata-universal-identifiers.command';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { SearchFieldMetadataEntity } from 'src/engine/metadata-modules/search-field-metadata/search-field-metadata.entity';
import { WorkspaceMetadataVersionModule } from 'src/engine/metadata-modules/workspace-metadata-version/workspace-metadata-version.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

@Module({
  imports: [
    ApplicationModule,
    TypeOrmModule.forFeature([SearchFieldMetadataEntity]),
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
    WorkspaceMetadataVersionModule,
    WorkspaceMigrationModule,
  ],
  providers: [
    AddEmailAttachmentFieldsCommand,
    NormalizeSearchFieldMetadataUniversalIdentifiersCommand,
  ],
})
export class V2_19_UpgradeVersionCommandModule {}
