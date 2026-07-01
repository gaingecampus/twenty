import { getAttachmentData } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/get-attachment-data.util';

describe('getAttachmentData', () => {
  it('should collect attachments from nested multipart parts', () => {
    const message = {
      payload: {
        mimeType: 'multipart/mixed',
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: 'dGV4dA==' },
          },
          {
            mimeType: 'multipart/alternative',
            parts: [
              {
                mimeType: 'text/html',
                body: { data: 'aHRtbA==' },
              },
            ],
          },
          {
            filename: 'invoice.pdf',
            mimeType: 'application/pdf',
            body: {
              attachmentId: 'ATTACHMENT_ID_1',
              size: 1024,
            },
          },
        ],
      },
    };

    expect(getAttachmentData(message)).toEqual([
      {
        filename: 'invoice.pdf',
        externalId: 'ATTACHMENT_ID_1',
        mimeType: 'application/pdf',
        size: 1024,
      },
    ]);
  });

  it('should return empty array when message has no attachments', () => {
    expect(getAttachmentData({})).toEqual([]);
  });
});
