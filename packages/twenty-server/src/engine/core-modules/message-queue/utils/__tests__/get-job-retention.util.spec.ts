import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { getJobRetention } from 'src/engine/core-modules/message-queue/utils/get-job-retention.util';

describe('getJobRetention', () => {
  it.each([
    MessageQueue.webhookQueue,
    MessageQueue.triggerQueue,
    MessageQueue.entityEventsToDbQueue,
  ])('immediately removes successful event jobs on %s', (queue) => {
    expect(getJobRetention(queue, {})).toEqual({
      removeOnComplete: true,
      removeOnFail: { age: 3600, count: 10 },
    });
  });

  it('does not retain large completed workflow jobs', () => {
    expect(
      getJobRetention(MessageQueue.workflowQueue, {
        state: 'x'.repeat(128 * 1024),
      }).removeOnComplete,
    ).toBe(true);
  });

  it('measures UTF-8 bytes instead of JavaScript character count', () => {
    expect(
      getJobRetention(MessageQueue.workflowQueue, {
        state: '한'.repeat(50_000),
      }).removeOnComplete,
    ).toBe(true);
  });

  it('retains bounded small job diagnostics', () => {
    expect(getJobRetention(MessageQueue.workflowQueue, {})).toEqual({
      removeOnComplete: { age: 900, count: 100 },
      removeOnFail: { age: 86400, count: 100 },
    });
  });
});
