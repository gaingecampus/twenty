import { Injectable } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordDeleteEvent,
  type ObjectRecordDestroyEvent,
  type ObjectRecordEvent,
  type ObjectRecordNonDestructiveEvent,
  type ObjectRecordRestoreEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { CreateEventLogFromInternalEvent } from 'src/engine/core-modules/event-logs/ingest/create-event-log-from-internal-event';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { CallWebhookJobsJob } from 'src/engine/metadata-modules/webhook/jobs/call-webhook-jobs.job';
import { compactWebhookEvent } from 'src/engine/metadata-modules/webhook/utils/compact-webhook-event.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { matchesDatabaseEvent } from 'src/engine/workspace-event-emitter/utils/matches-database-event.util';
import { CallDatabaseEventTriggerJobsJob } from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/database-event/call-database-event-trigger-jobs.job';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { ObjectRecordEventPublisher } from 'src/engine/subscriptions/object-record-event/object-record-event-publisher';
import { UpsertTimelineActivityFromInternalEvent } from 'src/modules/timeline/jobs/upsert-timeline-activity-from-internal-event.job';

@Injectable()
export class EntityEventsToDbListener {
  constructor(
    @InjectMessageQueue(MessageQueue.entityEventsToDbQueue)
    private readonly entityEventsToDbQueueService: MessageQueueService,
    @InjectMessageQueue(MessageQueue.webhookQueue)
    private readonly webhookQueueService: MessageQueueService,
    @InjectMessageQueue(MessageQueue.triggerQueue)
    private readonly triggerQueueService: MessageQueueService,
    private readonly objectRecordEventPublisher: ObjectRecordEventPublisher,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreate(batchEvent: WorkspaceEventBatch<ObjectRecordCreateEvent>) {
    return this.handleEvent(batchEvent, DatabaseEventAction.CREATED);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdate(batchEvent: WorkspaceEventBatch<ObjectRecordUpdateEvent>) {
    return this.handleEvent(batchEvent, DatabaseEventAction.UPDATED);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDelete(batchEvent: WorkspaceEventBatch<ObjectRecordDeleteEvent>) {
    return this.handleEvent(batchEvent, DatabaseEventAction.DELETED);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestore(
    batchEvent: WorkspaceEventBatch<ObjectRecordRestoreEvent>,
  ) {
    return this.handleEvent(batchEvent, DatabaseEventAction.RESTORED);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroy(
    batchEvent: WorkspaceEventBatch<ObjectRecordDestroyEvent>,
  ) {
    return this.handleEvent(batchEvent, DatabaseEventAction.DESTROYED);
  }

  private async handleEvent<T extends ObjectRecordEvent>(
    batchEvent: WorkspaceEventBatch<T>,
    action: DatabaseEventAction,
  ) {
    if (
      batchEvent.objectMetadata.universalIdentifier ===
      STANDARD_OBJECTS.timelineActivity.universalIdentifier
    ) {
      await this.objectRecordEventPublisher.publish(batchEvent);

      return;
    }

    const isAuditLogBatchEvent = batchEvent.objectMetadata?.isAuditLogged;

    const { flatWebhookMaps, flatLogicFunctionMaps } =
      await this.workspaceCacheService.getOrRecompute(batchEvent.workspaceId, [
        'flatWebhookMaps',
        'flatLogicFunctionMaps',
      ]);

    const hasWebhookSubscriber = Object.values(
      flatWebhookMaps.byUniversalIdentifier,
    ).some(
      (webhook) =>
        isDefined(webhook) &&
        webhook.operations.some((operation) =>
          matchesDatabaseEvent(batchEvent.name, operation),
        ),
    );

    const hasTriggerSubscriber = Object.values(
      flatLogicFunctionMaps.byUniversalIdentifier,
    ).some(
      (logicFunction) =>
        isDefined(logicFunction) &&
        !isDefined(logicFunction.deletedAt) &&
        isDefined(logicFunction.databaseEventTriggerSettings) &&
        matchesDatabaseEvent(
          batchEvent.name,
          logicFunction.databaseEventTriggerSettings.eventName,
        ),
    );

    const promises = [this.objectRecordEventPublisher.publish(batchEvent)];

    if (hasWebhookSubscriber) {
      promises.push(
        this.webhookQueueService.add(
          CallWebhookJobsJob.name,
          {
            ...batchEvent,
            events: batchEvent.events.map(compactWebhookEvent),
            objectMetadata: {
              id: batchEvent.objectMetadata.id,
              nameSingular: batchEvent.objectMetadata.nameSingular,
            },
          },
          {
            retryLimit: 3,
          },
        ),
      );
    }

    if (hasTriggerSubscriber) {
      promises.push(
        this.triggerQueueService.add<WorkspaceEventBatch<T>>(
          CallDatabaseEventTriggerJobsJob.name,
          batchEvent,
          { retryLimit: 3 },
        ),
      );
    }

    if (isAuditLogBatchEvent && action !== DatabaseEventAction.DESTROYED) {
      promises.push(
        this.entityEventsToDbQueueService.add<WorkspaceEventBatch<T>>(
          CreateEventLogFromInternalEvent.name,
          batchEvent,
        ),
      );

      promises.push(
        this.entityEventsToDbQueueService.add<
          WorkspaceEventBatch<ObjectRecordNonDestructiveEvent>
        >(
          UpsertTimelineActivityFromInternalEvent.name,
          batchEvent as WorkspaceEventBatch<ObjectRecordNonDestructiveEvent>,
        ),
      );
    }

    await Promise.all(promises);
  }
}
