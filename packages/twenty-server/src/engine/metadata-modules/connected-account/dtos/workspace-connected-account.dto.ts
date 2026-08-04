import { Field, Int, ObjectType } from '@nestjs/graphql';

import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MessageChannelSyncStatus } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('WorkspaceConnectedAccount')
export class WorkspaceConnectedAccountDTO {
  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  id: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  handle: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  provider: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  visibility: string;

  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  userWorkspaceId: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  ownerEmail: string | null;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  ownerFirstName: string | null;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  ownerLastName: string | null;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  ownerAvatarUrl: string | null;

  @IsOptional()
  @Field(() => MessageChannelSyncStatus, { nullable: true })
  syncStatus: MessageChannelSyncStatus | null;

  @IsUUID()
  @IsOptional()
  @Field(() => UUIDScalarType, { nullable: true })
  messageChannelId: string | null;

  @IsInt()
  @Field(() => Int)
  messageCount: number;

  @IsDateString()
  @IsOptional()
  @Field(() => Date, { nullable: true })
  syncedAt: Date | null;

  @IsDateString()
  @IsOptional()
  @Field(() => Date, { nullable: true })
  authFailedAt: Date | null;

  @IsDateString()
  @IsOptional()
  @Field(() => Date, { nullable: true })
  archivedAt: Date | null;

  @IsDateString()
  @Field()
  createdAt: Date;
}
