import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CampaignDraftReferenceInput {
  @Field() @IsUUID('4') id: string;
  @Field() @IsUUID('4') version: string;
}
