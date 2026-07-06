import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import {
  AggregateOperations,
  ViewFilterGroupLogicalOperator,
  ViewFilterOperand,
} from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('RelationRollupFilter')
@InputType('RelationRollupFilterInput')
export class RelationRollupFilterDTO {
  @Field(() => UUIDScalarType)
  @IsUUID()
  fieldMetadataUniversalIdentifier: string;

  @Field(() => UUIDScalarType, { nullable: true })
  @IsOptional()
  @IsUUID()
  relationTargetFieldMetadataUniversalIdentifier?: string | null;

  @Field(() => ViewFilterOperand)
  @IsEnum(ViewFilterOperand)
  operand: ViewFilterOperand;

  @Field(() => GraphQLJSON)
  value: string | string[] | boolean | Record<string, unknown>;

  @Field(() => UUIDScalarType, { nullable: true })
  @IsOptional()
  @IsUUID()
  viewFilterGroupId?: string | null;
}

@ObjectType('RelationRollupFilterGroup')
@InputType('RelationRollupFilterGroupInput')
export class RelationRollupFilterGroupDTO {
  @Field(() => UUIDScalarType)
  @IsUUID()
  id: string;

  @Field(() => UUIDScalarType, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentViewFilterGroupId?: string | null;

  @Field(() => ViewFilterGroupLogicalOperator)
  @IsEnum(ViewFilterGroupLogicalOperator)
  logicalOperator: ViewFilterGroupLogicalOperator;
}

@ObjectType('RelationRollupSettings')
@InputType('RelationRollupSettingsInput')
export class RelationRollupSettingsDTO {
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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  label?: string;

  @Field(() => [RelationRollupFilterDTO], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationRollupFilterDTO)
  recordFilters?: RelationRollupFilterDTO[];

  @Field(() => [RelationRollupFilterGroupDTO], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationRollupFilterGroupDTO)
  recordFilterGroups?: RelationRollupFilterGroupDTO[];
}
