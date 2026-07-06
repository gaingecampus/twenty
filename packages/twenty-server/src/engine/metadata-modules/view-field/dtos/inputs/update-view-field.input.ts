import { Field, InputType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AggregateOperations } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { RelationRollupSettingsDTO } from 'src/engine/metadata-modules/view-field/dtos/relation-rollup-settings.dto';

@InputType()
class UpdateViewFieldInputUpdates {
  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isVisible?: boolean;

  @IsOptional()
  @IsNumber()
  @Field({ nullable: true })
  size?: number;

  @IsOptional()
  @IsNumber()
  @Field({ nullable: true })
  position?: number;

  @IsOptional()
  @IsEnum(AggregateOperations)
  @Field(() => AggregateOperations, { nullable: true })
  aggregateOperation?: AggregateOperations;

  @IsOptional()
  @IsUUID()
  @Field(() => UUIDScalarType, { nullable: true })
  viewFieldGroupId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => RelationRollupSettingsDTO)
  @Field(() => RelationRollupSettingsDTO, { nullable: true })
  relationRollup?: RelationRollupSettingsDTO | null;
}

@InputType()
export class UpdateViewFieldInput {
  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType, {
    description: 'The id of the view field to update',
  })
  id: string;

  @Type(() => UpdateViewFieldInputUpdates)
  @ValidateNested()
  @Field(() => UpdateViewFieldInputUpdates, {
    description: 'The view field to update',
  })
  update: UpdateViewFieldInputUpdates;
}
