import { Injectable } from '@nestjs/common';

import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { MicrosoftOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/microsoft/microsoft-oauth2-client.provider';
import { type MessageImportAttachment } from 'src/modules/messaging/message-import-manager/types/message';

type MicrosoftAttachmentResponse = {
  id?: string;
  name?: string;
  contentType?: string;
  size?: number;
  '@odata.type'?: string;
};

@Injectable()
export class MicrosoftFetchAttachmentsService {
  constructor(
    private readonly microsoftOAuth2ClientProvider: MicrosoftOAuth2ClientProvider,
  ) {}

  async fetchAttachmentsByMessageIds({
    messageIds,
    connectedAccount,
  }: {
    messageIds: string[];
    connectedAccount: Pick<ConnectedAccountEntity, 'id' | 'provider'>;
  }): Promise<Map<string, MessageImportAttachment[]>> {
    const attachmentsByMessageId = new Map<string, MessageImportAttachment[]>();

    if (messageIds.length === 0) {
      return attachmentsByMessageId;
    }

    const client = await this.microsoftOAuth2ClientProvider.getClient(
      connectedAccount.id,
    );

    const batchLimit = 20;

    for (let index = 0; index < messageIds.length; index += batchLimit) {
      const batchMessageIds = messageIds.slice(index, index + batchLimit);

      const batchRequests = batchMessageIds.map((messageId, batchIndex) => ({
        id: (batchIndex + 1).toString(),
        method: 'GET',
        url: `/me/messages/${messageId}/attachments?$select=id,name,contentType,size`,
        headers: {
          'Content-Type': 'application/json',
        },
      }));

      const batchResponse = await client
        .api('/$batch')
        .post({ requests: batchRequests });

      for (const response of batchResponse.responses ?? []) {
        if (response.status !== 200) {
          continue;
        }

        const messageId = batchMessageIds[Number(response.id) - 1];

        if (!messageId) {
          continue;
        }

        const attachmentResponses: MicrosoftAttachmentResponse[] =
          response.body?.value ?? [];

        const attachments = attachmentResponses
          .filter(
            (attachment) =>
              attachment['@odata.type'] === '#microsoft.graph.fileAttachment' &&
              attachment.id,
          )
          .map((attachment) => ({
            filename: attachment.name ?? 'unnamed-attachment',
            externalId: attachment.id,
            mimeType: attachment.contentType,
            size: attachment.size,
          }));

        if (attachments.length > 0) {
          attachmentsByMessageId.set(messageId, attachments);
        }
      }
    }

    return attachmentsByMessageId;
  }
}
