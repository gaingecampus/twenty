import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  MaxLength,
} from 'class-validator';

@InputType()
export class UpdateSystemAlertSettingsInput {
  @Field(() => Boolean)
  @IsBoolean()
  enabled: boolean;

  @Field(() => [String])
  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  @MaxLength(254, { each: true })
  recipients: string[];
}

@ObjectType()
export class SystemAlertSettingsDTO {
  @Field(() => Boolean)
  enabled: boolean;

  @Field(() => [String])
  recipients: string[];

  @Field(() => Boolean)
  monitorRunning: boolean;

  @Field(() => Boolean)
  mailConfigured: boolean;

  @Field(() => String, { nullable: true })
  lastCheckedAt?: string;

  @Field(() => String, { nullable: true })
  lastSentAt?: string;

  @Field(() => String, { nullable: true })
  lastError?: string;

  @Field(() => String, { nullable: true })
  lastTestAt?: string;

  @Field(() => [String])
  activeIssues: string[];
}
