import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/engine/core-modules/file/file.module';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { CampaignAttachmentsService } from 'src/modules/emailing/services/campaign-attachments.service';
import { CampaignDraftService } from './campaign-draft.service';
import { CampaignDraftResolver } from './campaign-draft.resolver';

@Module({
  imports: [
    FileModule,
    PermissionsModule,
    TypeOrmModule.forFeature([FileEntity]),
  ],
  providers: [
    CampaignDraftService,
    CampaignDraftResolver,
    CampaignAttachmentsService,
    provideWorkspaceScopedRepository(FileEntity),
  ],
  exports: [CampaignDraftService],
})
export class CampaignDraftModule {}
