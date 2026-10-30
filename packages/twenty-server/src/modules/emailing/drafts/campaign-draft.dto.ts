import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { type CampaignDraft, type EmailAttachment } from 'twenty-shared/types';
import { CampaignAttachmentInput } from 'src/engine/core-modules/emailing-domain/dtos/send-message-campaign.input';

@InputType()
export class CampaignDraftContentInput implements CampaignDraft {
  @Field(() => String)
  @IsIn(['email', 'sms', 'coupon'])
  channel: CampaignDraft['channel'];
  @Field(() => String)
  @IsIn(['immediate', 'scheduled'])
  sendMode: CampaignDraft['sendMode'];
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  scheduledAt: string | null;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  unsubscribeTopicId: string | null;
  @Field(() => String)
  @IsIn(['list', 'direct'])
  recipientMode: CampaignDraft['recipientMode'];
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID('4') listId:
    | string
    | null;
  @Field() @IsString() @MaxLength(1000) directRecipient: string;
  @Field() @IsString() @MaxLength(998) subject: string;
  @Field() @IsString() @MaxLength(1000000) body: string;
  @Field() @IsString() @MaxLength(1000) fromAddress: string;
  @Field(() => [CampaignAttachmentInput])
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CampaignAttachmentInput)
  files: EmailAttachment[];
  @Field() @IsBoolean() includeSignature: boolean;
  @Field() @IsBoolean() advertising: boolean;
  @Field(() => String)
  @IsIn(['SIMULATION', 'LIVE'])
  couponMode: CampaignDraft['couponMode'];
  @Field() @IsString() @MaxLength(1000) productId: string;
  @Field(() => String)
  @IsIn(['SUCCESS', 'DELIVERY_FAILED', 'INSUFFICIENT_BALANCE', 'UNKNOWN'])
  scenario: CampaignDraft['scenario'];
}

@InputType()
export class SaveMessageCampaignDraftInput {
  @Field() @IsUUID('4') id: string;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  previousVersion?: string;
  @Field() @IsUUID('4') version: string;
  @Field(() => CampaignDraftContentInput)
  @ValidateNested()
  @Type(() => CampaignDraftContentInput)
  content: CampaignDraftContentInput;
}

@ObjectType()
export class SavedMessageCampaignDraft {
  @Field() id: string;
  @Field() version: string;
}
