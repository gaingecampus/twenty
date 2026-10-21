import { Queue } from 'bullmq';

import { BullMQDriver } from 'src/engine/core-modules/message-queue/drivers/bullmq.driver';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { type MetricsService } from 'src/engine/core-modules/metrics/metrics.service';

jest.mock('bullmq', () => ({
  Queue: jest.fn(),
  Worker: jest.fn(),
  MetricsTime: {},
}));

describe('BullMQDriver retention', () => {
  const queue = { add: jest.fn(), upsertJobScheduler: jest.fn() };
  let driver: BullMQDriver;

  beforeEach(() => {
    jest.mocked(Queue).mockImplementation(() => queue as unknown as Queue);
    driver = new BullMQDriver({ connection: {} }, {} as MetricsService);
    driver.register(MessageQueue.webhookQueue);
  });

  it('applies retention without changing retry attempts on normal jobs', async () => {
    await driver.add(MessageQueue.webhookQueue, 'event', {}, { retryLimit: 3 });
    expect(queue.add).toHaveBeenCalledWith(
      'event',
      {},
      expect.objectContaining({
        attempts: 4,
        removeOnComplete: true,
        removeOnFail: { age: 3600, count: 10 },
      }),
    );
  });

  it('also applies retention to recurring jobs', async () => {
    await driver.addCron({
      queueName: MessageQueue.webhookQueue,
      jobName: 'event',
      data: {},
      options: { repeat: { pattern: '* * * * *' } },
    });
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      expect.any(String),
      { pattern: '* * * * *' },
      expect.objectContaining({
        opts: expect.objectContaining({
          removeOnComplete: true,
          removeOnFail: { age: 3600, count: 10 },
        }),
      }),
    );
  });
});
