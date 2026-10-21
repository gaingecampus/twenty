import { type ObjectRecordEvent } from 'twenty-shared/database-events';

import { compactWebhookEvent } from 'src/engine/metadata-modules/webhook/utils/compact-webhook-event.util';
import { transformEventToWebhookEvent } from 'src/engine/metadata-modules/webhook/utils/transform-event-to-webhook-event';

const before = { id: 'run', state: { history: 'x'.repeat(500_000) } };
const after = { ...before, state: { history: 'y'.repeat(500_000) } };

describe('compactWebhookEvent', () => {
  it.each([
    ['created', { after }],
    [
      'updated',
      {
        before,
        after,
        diff: { state: { before: before.state, after: after.state } },
        updatedFields: ['state'],
      },
    ],
    ['deleted', { before, after, updatedFields: ['deletedAt'] }],
    ['restored', { before, after, updatedFields: ['deletedAt'] }],
    ['destroyed', { before }],
  ])('preserves the delivered %s event', (operation, properties) => {
    const event = {
      recordId: 'run',
      userId: 'user',
      workspaceMemberId: 'member',
      properties,
    } as ObjectRecordEvent;
    const original = JSON.stringify(event);
    const compact = compactWebhookEvent(event);
    const eventName = `workflowRun.${operation}`;

    expect(transformEventToWebhookEvent({ eventName, event: compact })).toEqual(
      transformEventToWebhookEvent({ eventName, event }),
    );
    expect(compact.userId).toBe('user');
    expect(compact.workspaceMemberId).toBe('member');
    expect(JSON.stringify(event)).toBe(original);
    if (operation === 'updated') {
      expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(
        Buffer.byteLength(original) * 0.26,
      );
    }
  });

  it('preserves secret redaction for webhook records', () => {
    const event = {
      recordId: 'webhook',
      properties: { after: { id: 'webhook', secret: 'hidden' } },
    };
    expect(
      transformEventToWebhookEvent({
        eventName: 'webhook.created',
        event: compactWebhookEvent(event),
      }).record,
    ).not.toHaveProperty('secret');
  });
});
