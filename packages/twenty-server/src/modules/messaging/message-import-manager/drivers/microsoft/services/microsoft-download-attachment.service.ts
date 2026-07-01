import { Injectable } from '@nestjs/common';

import { MicrosoftOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/microsoft/microsoft-oauth2-client.provider';

@Injectable()
export class MicrosoftDownloadAttachmentService {
  constructor(
    private readonly microsoftOAuth2ClientProvider: MicrosoftOAuth2ClientProvider,
  ) {}

  async downloadAttachment({
    connectedAccountId,
    messageExternalId,
    attachmentExternalId,
  }: {
    connectedAccountId: string;
    messageExternalId: string;
    attachmentExternalId: string;
  }): Promise<Buffer> {
    const client =
      await this.microsoftOAuth2ClientProvider.getClient(connectedAccountId);

    const response = await client
      .api(
        `/me/messages/${messageExternalId}/attachments/${attachmentExternalId}/$value`,
      )
      .getStream();

    const chunks: Buffer[] = [];

    for await (const chunk of response) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }
}
