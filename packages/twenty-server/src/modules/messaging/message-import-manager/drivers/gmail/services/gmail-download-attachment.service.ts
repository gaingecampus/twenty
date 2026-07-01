import { Injectable } from '@nestjs/common';

import { google } from 'googleapis';

import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';

@Injectable()
export class GmailDownloadAttachmentService {
  constructor(
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
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
    const oAuth2Client =
      await this.googleOAuth2ClientProvider.getClient(connectedAccountId);

    const gmailClient = google.gmail({
      version: 'v1',
      auth: oAuth2Client,
    });

    const response = await gmailClient.users.messages.attachments.get({
      userId: 'me',
      messageId: messageExternalId,
      id: attachmentExternalId,
    });

    const attachmentData = response.data.data;

    if (!attachmentData) {
      throw new Error(
        `Gmail attachment ${attachmentExternalId} on message ${messageExternalId} has no data`,
      );
    }

    return Buffer.from(attachmentData, 'base64url');
  }
}
