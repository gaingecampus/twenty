import { type JobsOptions } from 'bullmq';

import { QUEUE_RETENTION } from 'src/engine/core-modules/message-queue/constants/queue-retention.constants';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export const getJobRetention = (
  queueName: MessageQueue,
  data: unknown,
): Pick<JobsOptions, 'removeOnComplete' | 'removeOnFail'> => {
  const isEventQueue = [
    MessageQueue.webhookQueue,
    MessageQueue.triggerQueue,
    MessageQueue.entityEventsToDbQueue,
  ].includes(queueName);
  const isLargePayload =
    Buffer.byteLength(JSON.stringify(data) ?? '', 'utf8') >=
    QUEUE_RETENTION.largePayloadBytes;

  return {
    removeOnComplete:
      isEventQueue || isLargePayload
        ? true
        : {
            age: QUEUE_RETENTION.completedMaxAge,
            count: QUEUE_RETENTION.completedMaxCount,
          },
    removeOnFail:
      isEventQueue || isLargePayload
        ? {
            age: QUEUE_RETENTION.largeFailedMaxAge,
            count: QUEUE_RETENTION.largeFailedMaxCount,
          }
        : {
            age: QUEUE_RETENTION.failedMaxAge,
            count: QUEUE_RETENTION.failedMaxCount,
          },
  };
};
