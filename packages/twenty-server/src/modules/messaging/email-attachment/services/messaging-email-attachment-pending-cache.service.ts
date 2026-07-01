import { Injectable } from '@nestjs/common';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import {
  buildEmailAttachmentPendingCacheKey,
  EMAIL_ATTACHMENT_PENDING_CACHE_TTL_SECONDS,
} from 'src/modules/messaging/email-attachment/constants/email-attachment-pending-cache.constant';
import { type EmailAttachmentPendingContext } from 'src/modules/messaging/email-attachment/types/email-attachment-pending-context.type';

@Injectable()
export class MessagingEmailAttachmentPendingCacheService {
  constructor(
    @InjectCacheStorage(CacheStorageNamespace.ModuleMessaging)
    private readonly cacheStorage: CacheStorageService,
  ) {}

  async setPendingContext({
    workspaceId,
    messageId,
    context,
  }: {
    workspaceId: string;
    messageId: string;
    context: EmailAttachmentPendingContext;
  }): Promise<void> {
    await this.cacheStorage.set(
      buildEmailAttachmentPendingCacheKey({ workspaceId, messageId }),
      context,
      EMAIL_ATTACHMENT_PENDING_CACHE_TTL_SECONDS,
    );
  }

  async getPendingContext({
    workspaceId,
    messageId,
  }: {
    workspaceId: string;
    messageId: string;
  }): Promise<EmailAttachmentPendingContext | undefined> {
    return this.cacheStorage.get<EmailAttachmentPendingContext>(
      buildEmailAttachmentPendingCacheKey({ workspaceId, messageId }),
    );
  }

  async deletePendingContext({
    workspaceId,
    messageId,
  }: {
    workspaceId: string;
    messageId: string;
  }): Promise<void> {
    await this.cacheStorage.del(
      buildEmailAttachmentPendingCacheKey({ workspaceId, messageId }),
    );
  }
}
