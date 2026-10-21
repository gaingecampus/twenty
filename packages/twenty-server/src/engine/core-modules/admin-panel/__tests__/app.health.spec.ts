import { HealthIndicatorService } from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { statfs } from 'node:fs/promises';
import { type Repository } from 'typeorm';

import { AppHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/app.health';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

jest.mock('node:fs/promises', () => ({ statfs: jest.fn() }));

describe('AppHealthIndicator', () => {
  let service: AppHealthIndicator;
  let workspaceRepository: jest.Mocked<Repository<WorkspaceEntity>>;
  let healthIndicatorService: jest.Mocked<HealthIndicatorService>;

  beforeEach(async () => {
    jest.mocked(statfs).mockReset();
    jest.mocked(statfs).mockResolvedValue({
      bsize: 4096,
      blocks: 1000,
      bfree: 400,
      bavail: 350,
      files: 0,
      ffree: 0,
      type: 0,
    });
    workspaceRepository = {
      count: jest.fn(),
    } as any;

    healthIndicatorService = {
      check: jest.fn().mockReturnValue({
        up: jest.fn().mockImplementation((data) => ({
          app: { status: 'up', ...data },
        })),
        down: jest.fn().mockImplementation((data) => ({
          app: { status: 'down', ...data },
        })),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppHealthIndicator,
        {
          provide: getRepositoryToken(WorkspaceEntity),
          useValue: workspaceRepository,
        },
        {
          provide: HealthIndicatorService,
          useValue: healthIndicatorService,
        },
      ],
    }).compile();

    service = module.get<AppHealthIndicator>(AppHealthIndicator);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return up status when no issues and no pending migrations', async () => {
    workspaceRepository.count.mockResolvedValue(2);

    const result = await service.isHealthy();

    expect(result.app.status).toBe('up');
    expect(result.app.details.overview.totalWorkspacesCount).toBe(2);
    expect(result.app.details.overview.erroredWorkspaceCount).toBe(0);
    expect(result.app.details.system.nodeVersion).toBeDefined();
    expect(result.app.details.system.timestamp).toBeDefined();
  });

  it('reports process memory and computes CPU across a sampling interval', async () => {
    jest.spyOn(process.hrtime, 'bigint').mockReturnValue(BigInt(0));
    const cpuUsage = jest
      .spyOn(process, 'cpuUsage')
      .mockReturnValue({ user: 0, system: 0 });
    jest.spyOn(process, 'uptime').mockReturnValue(3661.5);
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 104857600,
      heapUsed: 52428800,
      heapTotal: 83886080,
      external: 0,
      arrayBuffers: 0,
    });
    service = new AppHealthIndicator(
      healthIndicatorService,
      workspaceRepository,
    );
    workspaceRepository.count.mockResolvedValue(2);

    const initial = await service.isHealthy();
    expect(initial.app.details.runtime.cpuPercent).toBeNull();

    jest.spyOn(process.hrtime, 'bigint').mockReturnValue(BigInt(5_000_000_000));
    cpuUsage.mockReturnValue({ user: 1_000_000, system: 250_000 });
    const sampled = await service.isHealthy();
    expect(sampled.app.details.runtime).toEqual({
      cpuPercent: 25,
      uptimeSeconds: 3661,
      residentMemoryBytes: 104857600,
      heapUsedBytes: 52428800,
      heapTotalBytes: 83886080,
    });

    // Concurrent viewers reuse the last sample instead of dividing by zero.
    const concurrent = await service.isHealthy();
    expect(concurrent.app.details.runtime.cpuPercent).toBe(25);
  });

  it('measures the application filesystem and excludes reserved blocks from available space', async () => {
    workspaceRepository.count.mockResolvedValue(2);
    const result = await service.isHealthy();

    expect(statfs).toHaveBeenCalledWith(process.cwd());
    expect(result.app.details.storage).toEqual({
      status: 'available',
      level: 'normal',
      path: process.cwd(),
      totalBytes: 4096000,
      usedBytes: 2457600,
      availableBytes: 1433600,
      utilizationPercent: 60,
    });
  });

  it('keeps runtime metrics available when filesystem access fails', async () => {
    workspaceRepository.count.mockResolvedValue(2);
    jest.mocked(statfs).mockRejectedValue(new Error('Permission denied'));
    const result = await service.isHealthy();

    expect(result.app.status).toBe('up');
    expect(result.app.details.storage).toEqual({
      status: 'unavailable',
      path: process.cwd(),
    });
    expect(result.app.details.runtime.residentMemoryBytes).toBeGreaterThan(0);
  });

  it('times out stalled filesystem checks without losing runtime metrics', async () => {
    workspaceRepository.count.mockResolvedValue(2);
    jest.mocked(statfs).mockReturnValue(new Promise(() => {}));
    const pending = service.isHealthy();

    await jest.advanceTimersByTimeAsync(10000);

    const result = await pending;

    expect(result.app.status).toBe('up');
    expect(result.app.details.storage.status).toBe('unavailable');
  });

  it('returns an outage when the workspace count never completes', async () => {
    workspaceRepository.count.mockReturnValue(new Promise(() => {}));
    const pending = service.isHealthy();

    await jest.advanceTimersByTimeAsync(10000);

    expect((await pending).app.status).toBe('down');
  });

  it('should maintain state history across health checks', async () => {
    // First check - healthy state
    workspaceRepository.count.mockResolvedValue(2);

    await service.isHealthy();

    // Second check - error state
    workspaceRepository.count.mockRejectedValue(
      new Error('Database connection failed'),
    );

    const result = await service.isHealthy();

    expect(result.app.details.stateHistory).toBeDefined();
    expect(result.app.details.stateHistory.age).toBeDefined();
    expect(result.app.details.stateHistory.timestamp).toBeDefined();
    expect(result.app.details.stateHistory.details).toBeDefined();
  });
});
