import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GaingeSalesDepartmentDTO {
  @Field(() => String)
  label: string;

  @Field(() => Float)
  amount: number;
}

@ObjectType()
export class GaingeSalesReportDTO {
  @Field(() => String)
  status: string;

  @Field(() => String)
  month: string;

  @Field(() => String, { nullable: true })
  startDate?: string;

  @Field(() => String, { nullable: true })
  endDate?: string;

  @Field(() => String, { nullable: true })
  generatedAt?: string;

  @Field(() => String, { nullable: true })
  fetchedAt?: string;

  @Field(() => Float, { nullable: true })
  total?: number;

  @Field(() => [GaingeSalesDepartmentDTO])
  departments: GaingeSalesDepartmentDTO[];
}
