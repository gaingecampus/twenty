import { ATTACHMENT_EMAIL_DIRECTION } from '@/activities/files/constants/attachment-email-direction.constant';
import { enrichAttachmentWithEmailDirection } from '@/activities/files/utils/enrichAttachmentWithEmailDirection';

describe('enrichAttachmentWithEmailDirection', () => {
  it('should add email direction from the message id map', () => {
    expect(
      enrichAttachmentWithEmailDirection(
        {
          targetMessageId: 'message-id',
        },
        {
          'message-id': ATTACHMENT_EMAIL_DIRECTION.INCOMING,
        },
      ),
    ).toEqual({
      targetMessageId: 'message-id',
      emailDirection: ATTACHMENT_EMAIL_DIRECTION.INCOMING,
    });
  });

  it('should keep existing email direction on the attachment', () => {
    expect(
      enrichAttachmentWithEmailDirection(
        {
          targetMessageId: 'message-id',
          emailDirection: ATTACHMENT_EMAIL_DIRECTION.OUTGOING,
        },
        {
          'message-id': ATTACHMENT_EMAIL_DIRECTION.INCOMING,
        },
      ),
    ).toEqual({
      targetMessageId: 'message-id',
      emailDirection: ATTACHMENT_EMAIL_DIRECTION.OUTGOING,
    });
  });

  it('should return attachment unchanged when message id is missing', () => {
    const attachment = {
      targetMessageId: null,
    };

    expect(
      enrichAttachmentWithEmailDirection(attachment, {
        'message-id': ATTACHMENT_EMAIL_DIRECTION.INCOMING,
      }),
    ).toEqual(attachment);
  });
});
