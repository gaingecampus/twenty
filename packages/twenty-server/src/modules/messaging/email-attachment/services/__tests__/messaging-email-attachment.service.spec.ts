import { MessageParticipantRole } from 'twenty-shared/types';

import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { MessagingEmailAttachmentService } from 'src/modules/messaging/email-attachment/services/messaging-email-attachment.service';
import { type EmailAttachmentPendingContext } from 'src/modules/messaging/email-attachment/types/email-attachment-pending-context.type';

describe('MessagingEmailAttachmentService', () => {
  const service = new MessagingEmailAttachmentService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  const getTargetPersonIds = (
    service as unknown as {
      getTargetPersonIds: (args: {
        participants: {
          role: MessageParticipantRole;
          personId: string | null;
        }[];
        direction: MessageDirection;
      }) => string[];
    }
  ).getTargetPersonIds.bind(service);

  it('should target FROM participant for incoming messages', () => {
    const personIds = getTargetPersonIds({
      direction: MessageDirection.INCOMING,
      participants: [
        { role: MessageParticipantRole.FROM, personId: 'person-from' },
        { role: MessageParticipantRole.TO, personId: 'person-to' },
      ],
    });

    expect(personIds).toEqual(['person-from']);
  });

  it('should target TO and CC participants for outgoing messages', () => {
    const personIds = getTargetPersonIds({
      direction: MessageDirection.OUTGOING,
      participants: [
        { role: MessageParticipantRole.FROM, personId: 'person-from' },
        { role: MessageParticipantRole.TO, personId: 'person-to' },
        { role: MessageParticipantRole.CC, personId: 'person-cc' },
        { role: MessageParticipantRole.BCC, personId: 'person-bcc' },
      ],
    });

    expect(personIds).toEqual(['person-to', 'person-cc']);
  });

  it('should return false when no target persons exist for pending context', () => {
    const pendingContext = {
      messageExternalId: 'ext-1',
      connectedAccountId: 'account-1',
      connectedAccountProvider: 'google',
      direction: MessageDirection.INCOMING,
      attachments: [],
    } as EmailAttachmentPendingContext;

    const hasTargetPersons = service.hasTargetPersonsForPendingContext({
      pendingContext,
      participants: [
        {
          role: MessageParticipantRole.FROM,
          personId: null,
        },
      ],
    });

    expect(hasTargetPersons).toBe(false);
  });

  it('should return true when outbound pending context has TO person', () => {
    const pendingContext = {
      messageExternalId: 'ext-1',
      connectedAccountId: 'account-1',
      connectedAccountProvider: 'google',
      direction: MessageDirection.OUTGOING,
      attachments: [],
      outboundAttachmentFileIds: ['file-1'],
    } as EmailAttachmentPendingContext;

    const hasTargetPersons = service.hasTargetPersonsForPendingContext({
      pendingContext,
      participants: [
        {
          role: MessageParticipantRole.TO,
          personId: 'person-to',
        },
      ],
    });

    expect(hasTargetPersons).toBe(true);
  });
});
