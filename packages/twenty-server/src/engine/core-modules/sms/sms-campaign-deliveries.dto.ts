import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

@InputType()
export class SmsCampaignDeliveriesInput {
  @Field(() => String)
  @IsUUID()
  campaignId: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  offset: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}

@ObjectType()
export class SmsCampaignDelivery {
  @Field(() => String) id: string;
  @Field(() => String) name: string;
  @Field(() => String) phone: string;
  @Field(() => String) messageType: string;
  @Field(() => String) status: string;
  @Field(() => String) createdAt: string;
  @Field(() => String, { nullable: true }) error?: string;
}

@ObjectType()
export class SmsCampaignDeliveryPage {
  @Field(() => Int) totalCount: number;
  @Field(() => [SmsCampaignDelivery]) records: SmsCampaignDelivery[];
}
