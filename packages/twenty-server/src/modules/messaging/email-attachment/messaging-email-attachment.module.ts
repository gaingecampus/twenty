import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileStorageModule } from 'src/engine/core-modules/file-storage/file-storage.module';
import { FileModule } from 'src/engine/core-modules/file/file.module';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { WorkspaceDataSourceModule } from 'src/engine/workspace-datasource/workspace-datasource.module';
import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';
import { MessagingPersistEmailAttachmentsJob } from 'src/modules/messaging/email-attachment/jobs/messaging-persist-email-attachments.job';
import { MessagingReprocessEmailAttachmentsCommand } from 'src/modules/messaging/email-attachment/commands/messaging-reprocess-email-attachments.command';
import { MessagingEmailAttachmentListener } from 'src/modules/messaging/email-attachment/listeners/messaging-email-attachment.listener';
import { MessagingEmailAttachmentPendingCacheService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment-pending-cache.service';
import { MessagingEmailAttachmentService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment.service';
import { MessagingGmailDriverModule } from 'src/modules/messaging/message-import-manager/drivers/gmail/messaging-gmail-driver.module';
import { MessagingIMAPDriverModule } from 'src/modules/messaging/message-import-manager/drivers/imap/messaging-imap-driver.module';
import { MessagingMicrosoftDriverModule } from 'src/modules/messaging/message-import-manager/drivers/microsoft/messaging-microsoft-driver.module';
import { GmailDownloadAttachmentService } from 'src/modules/messaging/message-import-manager/drivers/gmail/services/gmail-download-attachment.service';
import { MicrosoftDownloadAttachmentService } from 'src/modules/messaging/message-import-manager/drivers/microsoft/services/microsoft-download-attachment.service';

@Module({
  imports: [
    FileModule,
    FileStorageModule,
    WorkspaceDataSourceModule,
    OAuth2ClientManagerModule,
    MessagingGmailDriverModule,
    MessagingIMAPDriverModule,
    MessagingMicrosoftDriverModule,
    TypeOrmModule.forFeature([
      FileEntity,
      MessageChannelEntity,
    ]),
  ],
  providers: [
    provideWorkspaceScopedRepository(FileEntity),
    MessagingEmailAttachmentService,
    MessagingEmailAttachmentPendingCacheService,
    MessagingEmailAttachmentListener,
    MessagingPersistEmailAttachmentsJob,
    MessagingReprocessEmailAttachmentsCommand,
    GmailDownloadAttachmentService,
    MicrosoftDownloadAttachmentService,
  ],
  exports: [
    MessagingEmailAttachmentService,
    MessagingEmailAttachmentPendingCacheService,
  ],
})
export class MessagingEmailAttachmentModule {}
