import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';
import { FeatureFlagKey } from 'twenty-shared/types';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import {
  FeatureFlagGuard,
  RequireFeatureFlag,
} from 'src/engine/guards/feature-flag.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { fieldMetadataGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/field-metadata/utils/field-metadata-graphql-api-exception-handler.util';
import { fromFlatFieldMetadataToFieldMetadataDto } from 'src/engine/metadata-modules/flat-field-metadata/utils/from-flat-field-metadata-to-field-metadata-dto.util';
import { fromFlatObjectMetadataToObjectMetadataDto } from 'src/engine/metadata-modules/flat-object-metadata/utils/from-flat-object-metadata-to-object-metadata-dto.util';
import { CreateManyToManyRelationDTO } from 'src/engine/metadata-modules/many-to-many-relation/dtos/create-many-to-many-relation.dto';
import { CreateOneManyToManyRelationInput } from 'src/engine/metadata-modules/many-to-many-relation/dtos/create-many-to-many-relation.input';
import { RepairOneManyToManyJunctionUniqueIndexInput } from 'src/engine/metadata-modules/many-to-many-relation/dtos/repair-many-to-many-junction-unique-index.input';
import { ManyToManyRelationService } from 'src/engine/metadata-modules/many-to-many-relation/services/many-to-many-relation.service';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';

@UseGuards(
  WorkspaceAuthGuard,
  FeatureFlagGuard,
  SettingsPermissionGuard(PermissionFlagType.DATA_MODEL),
)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
export class ManyToManyRelationResolver {
  constructor(
    private readonly manyToManyRelationService: ManyToManyRelationService,
  ) {}

  @Mutation(() => CreateManyToManyRelationDTO)
  @RequireFeatureFlag(FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED)
  async createManyToManyRelation(
    @Args('input') input: CreateOneManyToManyRelationInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<CreateManyToManyRelationDTO> {
    try {
      const result =
        await this.manyToManyRelationService.createManyToManyRelation({
          workspaceId,
          input: input.manyToManyRelation,
        });

      return {
        sourceField: fromFlatFieldMetadataToFieldMetadataDto(
          result.sourceField,
        ),
        targetField: fromFlatFieldMetadataToFieldMetadataDto(
          result.targetField,
        ),
        junctionObject: fromFlatObjectMetadataToObjectMetadataDto(
          result.junctionObject,
        ),
      };
    } catch (error) {
      return fieldMetadataGraphqlApiExceptionHandler(error);
    }
  }

  @Mutation(() => Boolean)
  @RequireFeatureFlag(FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED)
  async repairManyToManyJunctionUniqueIndex(
    @Args('input') input: RepairOneManyToManyJunctionUniqueIndexInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    try {
      return await this.manyToManyRelationService.repairJunctionUniqueIndex({
        workspaceId,
        junctionObjectMetadataId: input.repair.junctionObjectMetadataId,
      });
    } catch (error) {
      return fieldMetadataGraphqlApiExceptionHandler(error);
    }
  }
}
