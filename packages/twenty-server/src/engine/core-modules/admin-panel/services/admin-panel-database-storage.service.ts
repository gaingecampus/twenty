import { Injectable } from '@nestjs/common';

import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isDefined } from 'twenty-shared/utils';

import { type DatabaseStorageMetrics } from 'src/engine/core-modules/admin-panel/types/database-storage-metrics.type';
import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const executeFile = promisify(execFile);
const GIBIBYTE = 1024 ** 3;
const CACHE_DURATION_MS = 60_000;
const MAX_METRIC_AGE_MS = 5 * 60_000;

@Injectable()
export class AdminPanelDatabaseStorageService {
  private cached: DatabaseStorageMetrics | undefined;
  private pending: Promise<DatabaseStorageMetrics> | undefined;

  constructor(private readonly config: TwentyConfigService) {}

  async getMetrics(): Promise<DatabaseStorageMetrics> {
    if (
      this.cached &&
      Date.now() - Date.parse(this.cached.checkedAt) < CACHE_DURATION_MS
    ) {
      return this.cached;
    }
    if (this.pending) return this.pending;

    this.pending = this.collectMetrics()
      .then((metrics) => {
        this.cached = metrics;
        return metrics;
      })
      .finally(() => {
        this.pending = undefined;
      });

    return this.pending;
  }

  private async collectMetrics(): Promise<DatabaseStorageMetrics> {
    const empty: DatabaseStorageMetrics = {
      source: 'unsupported',
      status: 'unavailable',
      totalBytes: null,
      availableBytes: null,
      checkedAt: new Date().toISOString(),
      availableMeasuredAt: null,
    };
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const databaseUrl = new URL(this.config.get('PG_DATABASE_URL'));
      const rdsEndpoint = databaseUrl.hostname.match(
        /^([a-z0-9-]+)\.[a-z0-9]+\.([a-z0-9-]+)\.rds\.amazonaws\.com(?:\.cn)?$/,
      );
      let collect: Promise<DatabaseStorageMetrics>;

      if (rdsEndpoint) {
        empty.source = 'rds';
        collect = this.readRds(
          databaseUrl,
          rdsEndpoint[1],
          rdsEndpoint[2],
          empty,
        );
      } else if (
        this.config.get('NODE_ENV') === NodeEnvironment.DEVELOPMENT &&
        ['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname)
      ) {
        empty.source = 'docker';
        collect = this.readDocker(databaseUrl, empty);
      } else {
        return empty;
      }

      return await Promise.race([
        collect,
        new Promise<DatabaseStorageMetrics>((resolve) => {
          timeout = setTimeout(() => resolve(empty), 2500);
        }),
      ]);
    } catch {
      // Missing monitoring access must not mark the database itself as down.
      return empty;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readDocker(
    databaseUrl: URL,
    empty: DatabaseStorageMetrics,
  ): Promise<DatabaseStorageMetrics> {
    // Only the repository's local development DB is inspected. Never mount the
    // Docker socket in the production app or inspect the API host's filesystem.
    const container = 'twenty-dev-db-1';
    const { stdout: portsJson } = await executeFile(
      'docker',
      ['inspect', '--format', '{{json .NetworkSettings.Ports}}', container],
      { timeout: 1000, maxBuffer: 16_384 },
    );
    const ports: Record<string, { HostPort: string }[] | null> =
      JSON.parse(portsJson);

    if (
      !ports['5432/tcp']?.some(
        (port) => port.HostPort === (databaseUrl.port || '5432'),
      )
    ) {
      return empty;
    }

    const { stdout } = await executeFile(
      'docker',
      [
        'exec',
        container,
        'stat',
        '-f',
        '-c',
        '%S %b %a',
        '/var/lib/postgresql/data',
      ],
      { timeout: 1000, maxBuffer: 16_384 },
    );
    const numbers = stdout.trim().split(/\s+/).map(Number);
    const [blockSize, blocks, availableBlocks] = numbers;
    const totalBytes = blockSize * blocks;
    const availableBytes = blockSize * availableBlocks;

    if (
      numbers.length !== 3 ||
      !Number.isSafeInteger(totalBytes) ||
      !Number.isSafeInteger(availableBytes) ||
      blockSize <= 0 ||
      totalBytes <= 0 ||
      availableBytes < 0 ||
      availableBytes > totalBytes
    )
      return empty;

    const checkedAt = new Date().toISOString();

    return {
      ...empty,
      status: 'available',
      totalBytes,
      availableBytes,
      checkedAt,
      availableMeasuredAt: checkedAt,
    };
  }

  private async readRds(
    databaseUrl: URL,
    instanceId: string,
    region: string,
    empty: DatabaseStorageMetrics,
  ): Promise<DatabaseStorageMetrics> {
    const rds = new RDSClient({ region, maxAttempts: 1 });
    const cloudWatch = new CloudWatchClient({ region, maxAttempts: 1 });
    const now = new Date();
    const abortSignal = AbortSignal.timeout(2000);

    try {
      const [instanceResult, metricResult] = await Promise.allSettled([
        rds.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId }),
          { abortSignal },
        ),
        cloudWatch.send(
          new GetMetricStatisticsCommand({
            Namespace: 'AWS/RDS',
            MetricName: 'FreeStorageSpace',
            Dimensions: [{ Name: 'DBInstanceIdentifier', Value: instanceId }],
            StartTime: new Date(now.getTime() - MAX_METRIC_AGE_MS),
            EndTime: now,
            Period: 60,
            Statistics: ['Average'],
            Unit: 'Bytes',
          }),
          { abortSignal },
        ),
      ]);
      const instance =
        instanceResult.status === 'fulfilled'
          ? instanceResult.value.DBInstances?.[0]
          : undefined;

      // Do not associate a same-named instance in another account with this DB.
      if (
        instance?.Endpoint?.Address !== databaseUrl.hostname ||
        instance.Endpoint.Port !== Number(databaseUrl.port || 5432) ||
        instance.Engine !== 'postgres' ||
        !isDefined(instance.AllocatedStorage) ||
        instance.AllocatedStorage <= 0
      )
        return empty;

      const totalBytes = instance.AllocatedStorage * GIBIBYTE;
      const sample =
        metricResult.status === 'fulfilled'
          ? metricResult.value.Datapoints?.filter(
              (point) =>
                isDefined(point.Timestamp) &&
                isDefined(point.Average) &&
                Number.isFinite(point.Average) &&
                point.Average >= 0 &&
                point.Average <= totalBytes &&
                point.Timestamp.getTime() >=
                  now.getTime() - MAX_METRIC_AGE_MS &&
                point.Timestamp.getTime() <= now.getTime(),
            ).sort(
              (left, right) =>
                right.Timestamp!.getTime() - left.Timestamp!.getTime(),
            )[0]
          : undefined;

      return {
        ...empty,
        totalBytes,
        status: sample ? 'available' : 'partial',
        availableBytes: sample?.Average ?? null,
        checkedAt: new Date().toISOString(),
        availableMeasuredAt: sample?.Timestamp?.toISOString() ?? null,
      };
    } finally {
      rds.destroy();
      cloudWatch.destroy();
    }
  }
}
