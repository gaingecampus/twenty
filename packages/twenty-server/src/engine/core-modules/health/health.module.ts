import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheStorageModule } from 'src/engine/core-modules/cache-storage/cache-storage.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { HealthController } from 'src/engine/core-modules/health/controllers/health.controller';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
    CacheStorageModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
