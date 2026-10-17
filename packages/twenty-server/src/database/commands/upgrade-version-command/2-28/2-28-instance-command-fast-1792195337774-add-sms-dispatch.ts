import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.28.0', 1792195337774)
export class AddSmsDispatchFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "core"."smsDispatch" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "requestId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "listId" uuid, "subject" character varying NOT NULL, "content" text NOT NULL, "from" character varying NOT NULL, "advertising" boolean NOT NULL DEFAULT false, "batches" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT \'QUEUED\', CONSTRAINT "PK_0599885a4da6e19c6d19053d615" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_SMS_DISPATCH_REQUEST" ON "core"."smsDispatch" ("workspaceId", "requestId") ',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."smsDispatch" ADD CONSTRAINT "FK_696549e9a4467bba9962885a401" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."smsDispatch" DROP CONSTRAINT "FK_696549e9a4467bba9962885a401"',
    );
    await queryRunner.query('DROP INDEX "core"."IDX_SMS_DISPATCH_REQUEST"');
    await queryRunner.query('DROP TABLE "core"."smsDispatch"');
  }
}
