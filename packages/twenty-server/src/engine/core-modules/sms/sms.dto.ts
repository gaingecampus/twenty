import { Type } from 'class-transformer';
import { CampaignDraftReferenceInput } from 'src/modules/emailing/drafts/campaign-draft-reference.input';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

@InputType()
export class SmsPreviewInput {
  @Field(() => String) @IsString() @Length(0, 15) subject: string;
  @Field(() => String) @IsUUID('4') listId: string;
  @Field(() => String) @IsString() @Length(1, 2000) content: string;
  @Field(() => Boolean) @IsBoolean() advertising: boolean;
}
@InputType()
export class SmsSendInput extends SmsPreviewInput {
  @Field(() => CampaignDraftReferenceInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignDraftReferenceInput)
  draft?: CampaignDraftReferenceInput;
  @Field(() => String) @IsUUID('4') requestId: string;
}
@ObjectType()
export class SmsPreview {
  @Field(() => Int) total: number;
  @Field(() => Int) missing: number;
  @Field(() => Int) duplicates: number;
  @Field(() => Int) sms: number;
  @Field(() => Int) lms: number;
  @Field(() => String) sample: string;
}
@ObjectType()
export class SmsDispatchSummary {
  @Field(() => String) id: string;
  @Field(() => String) subject: string;
  @Field(() => String) status: string;
  @Field(() => String) createdAt: string;
  @Field(() => Int) queued: number;
  @Field(() => Int) accepted: number;
  @Field(() => Int) failed: number;
  @Field(() => Int) unknown: number;
  @Field(() => [String]) errors: string[];
}
