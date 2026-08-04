import { Field, InputType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class CreateManyToManyRelationInput {
  @IsUUID()
  @Field(() => UUIDScalarType)
  sourceObjectMetadataId: string;

  @IsUUID()
  @Field(() => UUIDScalarType)
  targetObjectMetadataId: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  sourceFieldLabel: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  sourceFieldIcon?: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  targetFieldLabel: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  targetFieldIcon?: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  junctionLabelSingular?: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  junctionLabelPlural?: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  junctionIcon?: string;
}

@InputType()
export class CreateOneManyToManyRelationInput {
  @Type(() => CreateManyToManyRelationInput)
  @ValidateNested()
  @Field(() => CreateManyToManyRelationInput, {
    description: 'Many-to-many relation creation payload',
  })
  manyToManyRelation!: CreateManyToManyRelationInput;
}
