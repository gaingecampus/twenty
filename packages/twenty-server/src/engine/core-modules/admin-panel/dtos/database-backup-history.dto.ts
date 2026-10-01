import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('DatabaseBackupRun')
export class DatabaseBackupRunDTO {
  @Field(() => String)
  runId: string;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  completedAt: Date | null;

  @Field(() => Float, { nullable: true })
  durationMs: number | null;

  @Field(() => Float, { nullable: true })
  fileSizeBytes: number | null;

  @Field(() => String, { nullable: true })
  errorMessage: string | null;
}

@ObjectType('DatabaseBackupHistory')
export class DatabaseBackupHistoryDTO {
  @Field(() => Boolean)
  available: boolean;

  @Field(() => [DatabaseBackupRunDTO])
  runs: DatabaseBackupRunDTO[];
}
