import { Injectable, Logger } from '@nestjs/common';
import {
  type HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

import { Queue } from 'bullmq';

import { HEALTH_ERROR_MESSAGES } from 'src/engine/core-modules/admin-panel/constants/health-error-messages.constants';
import { METRICS_FAILURE_RATE_THRESHOLD } from 'src/engine/core-modules/admin-panel/constants/metrics-failure-rate-threshold.const';
import { type WorkerQueueHealth } from 'src/engine/core-modules/admin-panel/types/worker-queue-health.type';
import { withHealthCheckTimeout } from 'src/engine/core-modules/admin-panel/utils/health-check-timeout.util';
import { getRecentWorkerMetrics } from 'src/engine/core-modules/admin-panel/utils/get-recent-worker-metrics.util';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';

@Injectable()
export class WorkerHealthIndicator {
  private readonly logger = new Logger(WorkerHealthIndicator.name);

  constructor(
    private readonly redisClient: RedisClientService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check('worker');

    try {
      const workerStatus = await this.checkWorkers();

      if (workerStatus.status === 'up') {
        return indicator.up({
          queues: workerStatus.queues,
        });
      }

      return indicator.down({
        message: workerStatus.error,
        queues: workerStatus.queues,
      });
    } catch (error) {
      const errorMessage =
        error.message === HEALTH_ERROR_MESSAGES.WORKER_TIMEOUT
          ? HEALTH_ERROR_MESSAGES.WORKER_TIMEOUT
          : HEALTH_ERROR_MESSAGES.WORKER_CHECK_FAILED;

      return indicator.down({ message: errorMessage });
    }
  }

  async getQueueDetails(
    queueName: MessageQueue,
    options?: {
      pointsNeeded?: number;
    },
  ): Promise<WorkerQueueHealth | null> {
    const redis = this.redisClient.getQueueClient();
    const queue = new Queue(queueName, { connection: redis });

    try {
      const workers = await queue.getWorkers();

      if (workers.length > 0) {
        const pointsNeeded = options?.pointsNeeded ?? 60;

        const [
          failedMetrics,
          completedMetrics,
          waitingCount,
          activeCount,
          delayedCount,
        ] = await Promise.all([
          queue.getMetrics('failed', 0, pointsNeeded - 1),
          queue.getMetrics('completed', 0, pointsNeeded - 1),
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getDelayedCount(),
        ]);

        const now = Date.now();
        const failedData = getRecentWorkerMetrics(
          failedMetrics,
          pointsNeeded,
          now,
        );
        const completedData = getRecentWorkerMetrics(
          completedMetrics,
          pointsNeeded,
          now,
        );
        const failedCount = this.calculateMetricsSum(failedData);
        const completedCount = this.calculateMetricsSum(completedData);

        const totalJobs = failedCount + completedCount;
        const failureRate =
          totalJobs > 0
            ? Number(((failedCount / totalJobs) * 100).toFixed(1))
            : 0;

        return {
          queueName,
          workers: workers.length,
          status: failureRate > METRICS_FAILURE_RATE_THRESHOLD ? 'down' : 'up',
          errorMessage:
            failureRate > METRICS_FAILURE_RATE_THRESHOLD
              ? `최근 ${pointsNeeded}분 실패율 ${failureRate}% (실패 ${failedCount}건 / 전체 ${totalJobs}건, 기준 ${METRICS_FAILURE_RATE_THRESHOLD}% 초과)`
              : undefined,
          metrics: {
            failed: failedCount,
            completed: completedCount,
            waiting: waitingCount,
            active: activeCount,
            delayed: delayedCount,
            failureRate,
            ...(options?.pointsNeeded && {
              failedData,
              completedData,
            }),
          },
        };
      }

      const [waiting, active] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
      ]);
      // Optional idle queues need no worker, but stranded work must be visible.
      if (waiting + active > 0) {
        return {
          queueName,
          workers: 0,
          status: 'down',
          errorMessage: `실행 중인 워커 없음 · 대기 ${waiting}건 / 처리 중 ${active}건`,
          metrics: {
            waiting,
            active,
            delayed: 0,
            failed: 0,
            completed: 0,
            failureRate: 0,
          },
        };
      }
      return null;
    } catch (error) {
      this.logger.error(
        `Error getting queue details for ${queueName}: ${error.message}`,
      );
      throw error;
    } finally {
      await queue.close();
    }
  }

  private calculateMetricsSum(data: string[] | number[]): number {
    const sum = data.reduce((sum: number, value: string | number) => {
      const numericValue = Number(value);

      return sum + (isNaN(numericValue) ? 0 : numericValue);
    }, 0);

    return Math.round(Number(sum));
  }

  private async checkWorkers() {
    const queues = Object.values(MessageQueue);
    const queueStatuses: WorkerQueueHealth[] = [];

    const results = await Promise.allSettled(
      queues.map((queueName) =>
        withHealthCheckTimeout(
          this.getQueueDetails(queueName),
          HEALTH_ERROR_MESSAGES.WORKER_TIMEOUT,
        ),
      ),
    );
    let failedChecks = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value) queueStatuses.push(result.value);
      } else {
        failedChecks += 1;
        const error: unknown = result.reason;
        const message = error instanceof Error ? error.message : '';
        // Keep raw errors in server logs, not in the browser (Redis URLs may contain secrets).
        const reason =
          message === HEALTH_ERROR_MESSAGES.WORKER_TIMEOUT
            ? '큐 상태 조회 시간 초과 (3초)'
            : /NOPERM|NOAUTH|WRONGPASS/.test(message)
              ? 'Redis 인증 또는 명령 실행 권한 오류'
              : /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection is closed/.test(
                    message,
                  )
                ? 'Redis 연결 실패'
                : /[Ii]nvalid worker metrics|timestamp is in the future/.test(
                      message,
                    )
                  ? '작업 지표 또는 측정 시각 오류'
                  : '큐 상태 조회 실패 · 서버 로그 확인 필요';
        this.logger.error(
          `Error checking worker for queue ${queues[index]}: ${message}`,
        );
        queueStatuses.push({
          queueName: queues[index],
          workers: 0,
          status: 'down',
          errorMessage: reason,
          metrics: {
            waiting: 0,
            active: 0,
            delayed: 0,
            failed: 0,
            completed: 0,
            failureRate: 0,
          },
        });
      }
    });

    const hasActiveWorkers = queueStatuses.some((queue) => queue.workers > 0);

    return {
      status:
        hasActiveWorkers &&
        failedChecks === 0 &&
        queueStatuses.every((queue) => queue.status === 'up')
          ? 'up'
          : 'down',
      error:
        failedChecks > 0
          ? HEALTH_ERROR_MESSAGES.WORKER_CHECK_FAILED
          : !hasActiveWorkers
            ? HEALTH_ERROR_MESSAGES.NO_ACTIVE_WORKERS
            : queueStatuses.some((queue) => queue.status === 'down')
              ? 'Worker queue failure or unprocessed work detected'
              : undefined,
      queues: queueStatuses,
    };
  }
}
