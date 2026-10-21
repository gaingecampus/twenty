import { HealthCheckError, HealthCheckService } from '@nestjs/terminus';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { HealthController } from 'src/engine/core-modules/health/controllers/health.controller';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

describe('HealthController', () => {
  let controller: HealthController;
  const repository = { find: jest.fn() };
  const cache = { set: jest.fn(), get: jest.fn() };
  const health = {
    check: jest.fn((checks: Array<() => Promise<unknown>>) =>
      Promise.all(checks.map((check) => check())),
    ),
  };

  beforeEach(async () => {
    repository.find.mockResolvedValue([]);
    cache.set.mockResolvedValue(undefined);
    cache.get.mockResolvedValue('ok');
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: getRepositoryToken(WorkspaceEntity), useValue: repository },
        { provide: CacheStorageNamespace.EngineHealth, useValue: cache },
      ],
    }).compile();
    controller = module.get(HealthController);
  });

  it('keeps liveness separate from readiness', async () => {
    await controller.check();
    expect(repository.find).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('checks mapped workspace columns and a cache round trip', async () => {
    await expect(controller.ready()).resolves.toEqual([
      { database: { status: 'up' } },
      { cache: { status: 'up' } },
    ]);
    expect(repository.find).toHaveBeenCalledWith({ take: 1 });
    expect(cache.set).toHaveBeenCalledWith('readiness', 'ok', 5000);
  });

  it('fails readiness when mapped columns are missing', async () => {
    repository.find.mockRejectedValue(
      new Error('column workspace.uiTheme missing'),
    );
    await expect(controller.ready()).rejects.toThrow(HealthCheckError);
  });

  it('fails readiness when Redis PING would pass but writes fail', async () => {
    cache.set.mockRejectedValue(new Error('OOM'));
    await expect(controller.ready()).rejects.toThrow(HealthCheckError);
  });

  it('fails readiness when cache reads do not return the written value', async () => {
    cache.get.mockResolvedValue(undefined);
    await expect(controller.ready()).rejects.toThrow(HealthCheckError);
  });

  it('bounds stalled dependency checks', async () => {
    repository.find.mockReturnValue(new Promise(() => {}));
    const result = expect(controller.ready()).rejects.toThrow(HealthCheckError);
    await jest.advanceTimersByTimeAsync(3000);
    await result;
  });
});
