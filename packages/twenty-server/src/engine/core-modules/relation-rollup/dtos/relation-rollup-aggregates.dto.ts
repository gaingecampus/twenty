import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { AggregateOperations } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';

@InputType()
export class RelationRollupAggregateInput {
  @Field(() => String)
  @IsString()
  rollupKey: string;

  @Field(() => UUIDScalarType)
  @IsUUID()
  relationFieldMetadataUniversalIdentifier: string;

  @Field(() => AggregateOperations)
  @IsEnum(AggregateOperations)
  aggregateOperation: AggregateOperations;

  @Field(() => UUIDScalarType, { nullable: true })
  @IsOptional()
  @IsUUID()
  aggregateFieldMetadataUniversalIdentifier?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  filter?: ObjectRecordFilter;
}

@ObjectType()
export class RelationRollupAggregateValueDTO {
  @Field(() => UUIDScalarType)
  parentRecordId: string;

  @Field(() => String)
  aggregateFieldKey: string;

  @Field(() => GraphQLJSON, { nullable: true })
  value: string | number | null;
}

@ObjectType()
export class RelationRollupAggregateResultDTO {
  @Field(() => String)
  rollupKey: string;

  @Field(() => [RelationRollupAggregateValueDTO])
  values: RelationRollupAggregateValueDTO[];
}

@ArgsType()
export class RelationRollupAggregatesArgs {
  @Field(() => String)
  @IsString()
  parentObjectNameSingular: string;

  @Field(() => [UUIDScalarType])
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  parentRecordIds: string[];

  @Field(() => [RelationRollupAggregateInput])
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RelationRollupAggregateInput)
  rollups: RelationRollupAggregateInput[];
}
