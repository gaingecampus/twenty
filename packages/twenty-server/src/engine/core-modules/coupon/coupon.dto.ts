import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { type CouponScenario } from './coupon.types';

@InputType()
export class CouponPreviewInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  listId?: string;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  testPhone?: string;
  @Field(() => String) @IsIn(['SIMULATION', 'LIVE']) mode: string;
  @Field(() => String) @IsString() @Length(1, 100) productId: string;
  @Field(() => String) @IsString() @Length(1, 500) message: string;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title?: string;
  @Field(() => String)
  @IsIn(['SUCCESS', 'DELIVERY_FAILED', 'UNKNOWN', 'INSUFFICIENT_BALANCE'])
  scenario: CouponScenario;
}

@ObjectType()
export class CouponProductInfo {
  @Field(() => String) id: string;
  @Field(() => String) name: string;
  @Field(() => Int) price: number;
  @Field(() => Int) validityDays: number;
}

@ObjectType()
export class CouponCapabilities {
  @Field(() => String) mode: string;
  @Field(() => Boolean) liveAvailable: boolean;
  @Field(() => String) liveBlockedReason: string;
  @Field(() => Int) simulationBudget: number;
  @Field(() => Int) liveBudget: number;
  @Field(() => String, { nullable: true }) environment?: string;
  @Field(() => [CouponProductInfo]) liveProducts: CouponProductInfo[];
  @Field(() => [CouponProductInfo]) products: CouponProductInfo[];
}

@ObjectType()
export class CouponRecipientInfo {
  @Field(() => String, { nullable: true }) personId: string | null;
  @Field(() => String) phone: string;
  @Field(() => String) status: string;
}

@ObjectType()
export class CouponDispatchSummary {
  @Field(() => String, { nullable: true }) orderId?: string;
  @Field(() => String, { nullable: true }) orderTrId?: string;
  @Field(() => String, { nullable: true }) environment?: string;
  @Field(() => String, { nullable: true }) title?: string;
  @Field(() => Int, { nullable: true }) actualCost?: number;
  @Field(() => String) id: string;
  @Field(() => String) mode: string;
  @Field(() => String) status: string;
  @Field(() => String) createdAt: string;
  @Field(() => String) expiresAt: string;
  @Field(() => String) scenario: string;
  @Field(() => String) message: string;
  @Field(() => CouponProductInfo) product: CouponProductInfo;
  @Field(() => Int) total: number;
  @Field(() => Int) missing: number;
  @Field(() => Int) duplicates: number;
  @Field(() => Int) recipientCount: number;
  @Field(() => Int) estimatedCost: number;
  @Field(() => [CouponRecipientInfo]) recipients: CouponRecipientInfo[];
}
