import { Type } from 'class-transformer';
import { Field, InputType } from '@nestjs/graphql';

import {
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';

@InputType()
export class CampaignAttachmentInput {
  @Field(() => String)
  @IsUUID('4')
  id: string;

  @Field(() => String)
  @IsString()
  @Length(1, 255)
  name: string;
}

@InputType()
export class SendMessageCampaignInput {
  @Field(() => [CampaignAttachmentInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CampaignAttachmentInput)
  files?: CampaignAttachmentInput[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  scheduledAt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  campaignId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  scheduleVersion?: string;

  @Field(() => String)
  @IsUUID('4')
  listId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  unsubscribeTopicId?: string;

  @Field(() => String)
  @IsString()
  @Length(1, 998)
  subject: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  body: string;

  @Field(() => String)
  @IsEmail()
  fromAddress: string;
}
