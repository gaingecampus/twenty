import { type gmail_v1 as gmailV1 } from 'googleapis';

type GmailMessagePart = gmailV1.Schema$MessagePart;

const collectAttachmentParts = (
  part: GmailMessagePart,
  accumulator: GmailMessagePart[],
) => {
  if (part.filename && part.body?.attachmentId) {
    accumulator.push(part);
  }

  for (const childPart of part.parts ?? []) {
    collectAttachmentParts(childPart, accumulator);
  }
};

export const getAttachmentData = (message: gmailV1.Schema$Message) => {
  const attachmentParts: GmailMessagePart[] = [];

  if (message.payload) {
    collectAttachmentParts(message.payload, attachmentParts);
  }

  return attachmentParts.map((part) => ({
    filename: part.filename ?? '',
    externalId: part.body?.attachmentId ?? '',
    mimeType: part.mimeType ?? '',
    size: part.body?.size ?? 0,
  }));
};
