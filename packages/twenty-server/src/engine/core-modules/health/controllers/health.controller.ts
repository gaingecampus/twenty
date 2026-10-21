import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
} from '@nestjs/terminus';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller('healthz')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectCacheStorage(CacheStorageNamespace.EngineHealth)
    private readonly cacheStorage: CacheStorageService,
  ) {}

  @Get()
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  @Get('ready')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  @HealthCheck()
  ready() {
    return this.health.check([
      () =>
        this.checkDependency('database', async () => {
          // Select mapped columns: SELECT 1 would miss a schema/image mismatch.
          await this.workspaceRepository.find({ take: 1 });
        }),
      () =>
        this.checkDependency('cache', async () => {
          // PING succeeds even when Redis refuses writes due to maxmemory.
          await this.cacheStorage.set('readiness', 'ok', 5000);
          if ((await this.cacheStorage.get('readiness')) !== 'ok') {
            throw new Error('Cache read failed');
          }
        }),
    ]);
  }

  private async checkDependency(name: string, check: () => Promise<void>) {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        check(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Readiness timed out')),
            3000,
          );
        }),
      ]);

      return { [name]: { status: 'up' as const } };
    } catch {
      // Do not expose connection strings or database errors publicly.
      throw new HealthCheckError('Dependency unavailable', {
        [name]: { status: 'down' },
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
