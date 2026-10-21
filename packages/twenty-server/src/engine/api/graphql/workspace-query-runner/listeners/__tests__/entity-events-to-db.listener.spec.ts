import { type ObjectRecordUpdateEvent } from 'twenty-shared/database-events';

import { EntityEventsToDbListener } from 'src/engine/api/graphql/workspace-query-runner/listeners/entity-events-to-db.listener';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type ObjectRecordEventPublisher } from 'src/engine/subscriptions/object-record-event/object-record-event-publisher';
import { type WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';

const batch = {
  name: 'workflowRun.updated',
  workspaceId: 'workspace',
  objectMetadata: {
    id: 'metadata',
    nameSingular: 'workflowRun',
    universalIdentifier: 'workflow-run',
    isAuditLogged: false,
  },
  events: [
    {
      recordId: 'run',
      properties: {
        before: { state: 'before' },
        after: { state: 'after' },
        diff: { state: { before: 'before', after: 'after' } },
        updatedFields: ['state'],
      },
    },
  ],
} as WorkspaceEventBatch<ObjectRecordUpdateEvent>;

describe('EntityEventsToDbListener subscriptions', () => {
  const auditQueue = { add: jest.fn() };
  const webhookQueue = { add: jest.fn() };
  const triggerQueue = { add: jest.fn() };
  const publisher = { publish: jest.fn() };
  const cache = { getOrRecompute: jest.fn() };
  const listener = new EntityEventsToDbListener(
    auditQueue as unknown as MessageQueueService,
    webhookQueue as unknown as MessageQueueService,
    triggerQueue as unknown as MessageQueueService,
    publisher as unknown as ObjectRecordEventPublisher,
    cache as unknown as WorkspaceCacheService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    cache.getOrRecompute.mockResolvedValue({
      flatWebhookMaps: { byUniversalIdentifier: {} },
      flatLogicFunctionMaps: { byUniversalIdentifier: {} },
    });
  });

  it('does not queue unsubscribed workflow events but still publishes them', async () => {
    await listener.handleUpdate(batch);
    expect(webhookQueue.add).not.toHaveBeenCalled();
    expect(triggerQueue.add).not.toHaveBeenCalled();
    expect(publisher.publish).toHaveBeenCalledWith(batch);
  });

  it.each(['workflowRun.updated', '*.updated', 'workflowRun.*', '*.*'])(
    'queues subscribed %s events with original trigger data',
    async (eventName) => {
      cache.getOrRecompute.mockResolvedValue({
        flatWebhookMaps: {
          byUniversalIdentifier: { webhook: { operations: [eventName] } },
        },
        flatLogicFunctionMaps: {
          byUniversalIdentifier: {
            trigger: { databaseEventTriggerSettings: { eventName } },
          },
        },
      });
      await listener.handleUpdate(batch);
      expect(triggerQueue.add).toHaveBeenCalledWith(expect.any(String), batch, {
        retryLimit: 3,
      });
      const webhookBatch = webhookQueue.add.mock.calls[0][1];
      expect(webhookBatch.events[0].properties).toEqual({
        after: { state: 'after' },
        updatedFields: ['state'],
      });
      expect(batch.events[0].properties).toHaveProperty('diff');
    },
  );

  it('ignores unrelated webhooks and deleted triggers', async () => {
    cache.getOrRecompute.mockResolvedValue({
      flatWebhookMaps: {
        byUniversalIdentifier: { webhook: { operations: ['person.updated'] } },
      },
      flatLogicFunctionMaps: {
        byUniversalIdentifier: {
          trigger: {
            deletedAt: new Date(),
            databaseEventTriggerSettings: { eventName: '*.*' },
          },
        },
      },
    });
    await listener.handleUpdate(batch);
    expect(webhookQueue.add).not.toHaveBeenCalled();
    expect(triggerQueue.add).not.toHaveBeenCalled();
  });

  it('keeps audit and timeline jobs without external subscribers', async () => {
    await listener.handleUpdate({
      ...batch,
      objectMetadata: { ...batch.objectMetadata, isAuditLogged: true },
    });
    expect(auditQueue.add).toHaveBeenCalledTimes(2);
  });
});
