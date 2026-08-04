import { Field, InputType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class RepairManyToManyJunctionUniqueIndexInput {
  @IsUUID()
  @Field(() => UUIDScalarType)
  junctionObjectMetadataId: string;
}

@InputType()
export class RepairOneManyToManyJunctionUniqueIndexInput {
  @Type(() => RepairManyToManyJunctionUniqueIndexInput)
  @ValidateNested()
  @Field(() => RepairManyToManyJunctionUniqueIndexInput)
  repair!: RepairManyToManyJunctionUniqueIndexInput;
}
