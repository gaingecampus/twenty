import { HealthIndicatorService } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';

import { WorkerHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/worker.health';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';

const mockQueueInstance = {
  getWorkers: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  getMetrics: jest.fn(),
  getWaitingCount: jest.fn(),
  getActiveCount: jest.fn(),
  getDelayedCount: jest.fn(),
};

jest.mock('bullmq', () => ({ Queue: jest.fn(() => mockQueueInstance) }));

const metrics = (count = 0, ageMinutes = 0) => ({
  meta: { count, prevCount: 0, prevTS: Date.now() - ageMinutes * 60_000 },
  count: 10080, // Number of stored buckets, NOT the number of jobs.
  data: [],
});

describe('WorkerHealthIndicator', () => {
  let service: WorkerHealthIndicator;

  beforeEach(async () => {
    jest.useFakeTimers();
    const module = await Test.createTestingModule({
      providers: [
        WorkerHealthIndicator,
        HealthIndicatorService,
        {
          provide: RedisClientService,
          useValue: { getQueueClient: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(WorkerHealthIndicator);
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    mockQueueInstance.getWorkers.mockResolvedValue([{ id: 'worker' }]);
    mockQueueInstance.getMetrics.mockResolvedValue(metrics());
    mockQueueInstance.getWaitingCount.mockResolvedValue(0);
    mockQueueInstance.getActiveCount.mockResolvedValue(0);
    mockQueueInstance.getDelayedCount.mockResolvedValue(0);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('checks and closes every queue, ignoring optional idle queues', async () => {
    mockQueueInstance.getWorkers.mockResolvedValueOnce([]);
    expect((await service.isHealthy()).worker.status).toBe('up');
    expect(mockQueueInstance.close).toHaveBeenCalledTimes(
      Object.keys(MessageQueue).length,
    );
    expect(mockQueueInstance.getMetrics).toHaveBeenCalledWith('failed', 0, 59);
  });

  it('reports no workers when every queue is idle without a worker', async () => {
    mockQueueInstance.getWorkers.mockResolvedValue([]);
    expect((await service.isHealthy()).worker).toMatchObject({
      status: 'down',
      message: 'No active workers found',
    });
  });

  it('reports the affected queue and stranded work counts', async () => {
    mockQueueInstance.getWorkers.mockResolvedValueOnce([]);
    mockQueueInstance.getWaitingCount.mockResolvedValue(3);
    const result = await service.isHealthy();
    expect(result.worker.status).toBe('down');
    expect(result.worker.queues).toContainEqual(
      expect.objectContaining({
        queueName: MessageQueue.taskAssignedQueue,
        errorMessage: '실행 중인 워커 없음 · 대기 3건 / 처리 중 0건',
      }),
    );
  });

  it('uses recent job counts rather than bucket lengths for failure rate', async () => {
    mockQueueInstance.getMetrics.mockImplementation((type) =>
      Promise.resolve(metrics(type === 'failed' ? 6 : 4)),
    );
    const result = await service.isHealthy();
    expect(result.worker.status).toBe('down');
    expect(result.worker.queues[0]).toMatchObject({
      errorMessage:
        '최근 60분 실패율 60% (실패 6건 / 전체 10건, 기준 20% 초과)',
      metrics: { failed: 6, completed: 4, failureRate: 60 },
    });
  });

  it('does not alert at exactly 20 percent', async () => {
    mockQueueInstance.getMetrics.mockImplementation((type) =>
      Promise.resolve(metrics(type === 'failed' ? 2 : 8)),
    );
    expect((await service.isHealthy()).worker.status).toBe('up');
  });

  it('ages out historical failures even when the failed series has not advanced', async () => {
    mockQueueInstance.getMetrics.mockImplementation((type) =>
      Promise.resolve(
        type === 'failed'
          ? { ...metrics(1000, 12 * 24 * 60), data: [500] }
          : metrics(10),
      ),
    );
    expect((await service.isHealthy()).worker.status).toBe('up');
    expect(mockQueueInstance.getMetrics).toHaveBeenCalledWith('failed', 0, 59);
  });

  it('recovers after an hour without deleting or retrying historical jobs', async () => {
    mockQueueInstance.getMetrics.mockImplementation((type) =>
      Promise.resolve(metrics(type === 'failed' ? 1 : 0)),
    );
    // Freeze the last event: no new completions are needed for recovery.
    const failed = metrics(1);
    mockQueueInstance.getMetrics.mockImplementation((type) =>
      Promise.resolve(type === 'failed' ? failed : metrics()),
    );
    expect((await service.isHealthy()).worker.status).toBe('down');
    jest.setSystemTime(Date.now() + 60 * 60_000);
    expect((await service.isHealthy()).worker.status).toBe('up');
  });

  it('keeps healthy queues visible when a single queue times out', async () => {
    mockQueueInstance.getWorkers.mockImplementationOnce(
      () => new Promise(() => {}),
    );
    const pending = service.isHealthy();
    await jest.advanceTimersByTimeAsync(3000);
    const result = await pending;
    expect(result.worker).toMatchObject({
      status: 'down',
      message: 'Worker check failed',
    });
    expect(result.worker.queues).toContainEqual(
      expect.objectContaining({
        queueName: MessageQueue.taskAssignedQueue,
        errorMessage: '큐 상태 조회 시간 초과 (3초)',
      }),
    );
    expect(
      result.worker.queues.some(
        (queue: { status: string }) => queue.status === 'up',
      ),
    ).toBe(true);
  });

  it('distinguishes Redis permission errors from no workers without exposing secrets', async () => {
    mockQueueInstance.getWorkers.mockRejectedValue(
      new Error('NOPERM redis://secret@host'),
    );
    const result = await service.isHealthy();
    expect(result.worker.message).toBe('Worker check failed');
    expect(result.worker.queues[0].errorMessage).toBe(
      'Redis 인증 또는 명령 실행 권한 오류',
    );
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('returns time-aligned data for queue graphs', async () => {
    mockQueueInstance.getMetrics.mockResolvedValue({
      ...metrics(12, 2),
      meta: { ...metrics(12, 2).meta, prevCount: 10 },
      data: [5, 3],
    });
    const result = await service.getQueueDetails(MessageQueue.cronQueue, {
      pointsNeeded: 5,
    });
    expect(result?.metrics).toMatchObject({
      failed: 10,
      failedData: [3, 5, 2, 0, 0],
    });
  });
});
