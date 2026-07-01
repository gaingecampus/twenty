import { type MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { type ConnectedAccountProvider } from 'twenty-shared/types';
import { type MessageImportAttachment } from 'src/modules/messaging/message-import-manager/types/message';

export type EmailAttachmentPendingContext = {
  messageExternalId: string;
  connectedAccountId: string;
  connectedAccountProvider: ConnectedAccountProvider;
  direction: MessageDirection;
  attachments: MessageImportAttachment[];
  htmlBody?: string;
  textBody?: string;
  outboundAttachmentFileIds?: string[];
};
