import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { FileModule } from 'src/engine/core-modules/file/file.module';
import { RecordFileRegistrationService } from 'src/engine/core-modules/file/record-file-registration/record-file-registration.service';
import { RecordCrudModule } from 'src/engine/core-modules/record-crud/record-crud.module';
import { AgentMessagePartEntity } from 'src/engine/metadata-modules/ai/ai-agent-execution/entities/agent-message-part.entity';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity, AgentMessagePartEntity]),
    FileModule,
    RecordCrudModule,
    PermissionsModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
  ],
  providers: [
    RecordFileRegistrationService,
    provideWorkspaceScopedRepository(FileEntity),
    provideWorkspaceScopedRepository(AgentMessagePartEntity),
  ],
  exports: [RecordFileRegistrationService],
})
export class RecordFileRegistrationModule {}
