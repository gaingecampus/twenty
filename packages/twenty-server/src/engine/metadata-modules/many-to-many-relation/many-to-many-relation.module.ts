import { Module } from '@nestjs/common';

import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { FeatureFlagGuard } from 'src/engine/guards/feature-flag.guard';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { IndexMetadataModule } from 'src/engine/metadata-modules/index-metadata/index-metadata.module';
import { ManyToManyRelationResolver } from 'src/engine/metadata-modules/many-to-many-relation/many-to-many-relation.resolver';
import { ManyToManyRelationService } from 'src/engine/metadata-modules/many-to-many-relation/services/many-to-many-relation.service';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

@Module({
  imports: [
    ApplicationModule,
    FeatureFlagModule,
    FieldMetadataModule,
    IndexMetadataModule,
    ObjectMetadataModule,
    PermissionsModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    WorkspaceMigrationModule,
  ],
  providers: [
    ManyToManyRelationService,
    ManyToManyRelationResolver,
    FeatureFlagGuard,
  ],
  exports: [ManyToManyRelationService],
})
export class ManyToManyRelationModule {}
