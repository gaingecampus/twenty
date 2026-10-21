import { Injectable } from '@nestjs/common';
import {
  type HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { InjectRepository } from '@nestjs/typeorm';

import { statfs } from 'node:fs/promises';
import { Repository } from 'typeorm';

import { HealthStateManager } from 'src/engine/core-modules/admin-panel/utils/health-state-manager.util';
import { withHealthCheckTimeout } from 'src/engine/core-modules/admin-panel/utils/health-check-timeout.util';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class AppHealthIndicator {
  private stateManager = new HealthStateManager();
  private cpuSample = {
    usage: process.cpuUsage(),
    time: process.hrtime.bigint(),
  };
  private cpuPercent: number | null = null;

  private async getStorageMetrics() {
    const path = process.cwd();

    try {
      const filesystem = await withHealthCheckTimeout(
        statfs(path),
        'Application storage check timed out',
      );
      const totalBytes = filesystem.blocks * filesystem.bsize;
      const usedBytes =
        (filesystem.blocks - filesystem.bfree) * filesystem.bsize;
      // bavail excludes blocks reserved for privileged users.
      const availableBytes = filesystem.bavail * filesystem.bsize;

      if (
        !Number.isFinite(totalBytes) ||
        totalBytes <= 0 ||
        !Number.isFinite(usedBytes) ||
        usedBytes < 0 ||
        usedBytes > totalBytes ||
        !Number.isFinite(availableBytes) ||
        availableBytes < 0 ||
        availableBytes > totalBytes - usedBytes
      ) {
        throw new Error('Invalid filesystem capacity');
      }

      return {
        status: 'available',
        level: availableBytes / totalBytes <= 0.1 ? 'warning' : 'normal',
        path,
        totalBytes,
        usedBytes,
        availableBytes,
        utilizationPercent: Math.round((usedBytes / totalBytes) * 1000) / 10,
      };
    } catch {
      return { status: 'unavailable', path };
    }
  }

  private getRuntimeMetrics() {
    const time = process.hrtime.bigint();
    const elapsedMicroseconds = Number(time - this.cpuSample.time) / 1000;

    // Reuse the sample for simultaneous viewers; CPU is relative to one core.
    if (elapsedMicroseconds >= 1_000_000) {
      const usage = process.cpuUsage();
      const consumedMicroseconds =
        usage.user -
        this.cpuSample.usage.user +
        usage.system -
        this.cpuSample.usage.system;

      this.cpuPercent =
        Math.round((consumedMicroseconds / elapsedMicroseconds) * 1000) / 10;
      this.cpuSample = { usage, time };
    }

    const memory = process.memoryUsage();

    return {
      cpuPercent: this.cpuPercent,
      uptimeSeconds: Math.floor(process.uptime()),
      residentMemoryBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal,
    };
  }

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  // TODO refactor, a workspace health should be based on its app versioning
  async isHealthy(): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check('app');

    try {
      const [totalWorkspaceCount, storage] = await Promise.all([
        withHealthCheckTimeout(
          this.workspaceRepository.count(),
          'Server health check timed out',
        ),
        this.getStorageMetrics(),
      ]);

      const details = {
        system: {
          nodeVersion: process.version,
          timestamp: new Date().toISOString(),
        },
        runtime: this.getRuntimeMetrics(),
        storage,
        overview: {
          totalWorkspacesCount: totalWorkspaceCount,
          erroredWorkspaceCount: 0,
        },
        erroredWorkspace: 0,
      };

      this.stateManager.updateState(details);

      return indicator.up({ details });
    } catch (error) {
      const stateWithAge = this.stateManager.getStateWithAge();

      return indicator.down({
        message: error.message,
        details: {
          system: {
            nodeVersion: process.version,
            timestamp: new Date().toISOString(),
          },
          stateHistory: stateWithAge,
        },
      });
    }
  }
}
