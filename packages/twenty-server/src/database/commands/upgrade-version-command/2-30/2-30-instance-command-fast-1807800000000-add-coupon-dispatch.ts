import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.30.0', 1807800000000)
export class AddCouponDispatchFastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "core"."couponDispatch" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "workspaceId" uuid NOT NULL REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
      "userWorkspaceId" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "listId" uuid,
      "mode" varchar NOT NULL DEFAULT 'SIMULATION' CHECK ("mode" = 'SIMULATION'),
      "status" varchar NOT NULL DEFAULT 'PREVIEW',
      "product" jsonb NOT NULL,
      "recipients" jsonb NOT NULL,
      "scenario" varchar NOT NULL,
      "message" text NOT NULL,
      "total" integer NOT NULL,
      "missing" integer NOT NULL,
      "duplicates" integer NOT NULL,
      "estimatedCost" integer NOT NULL CHECK ("estimatedCost" >= 0),
      "expiresAt" timestamptz NOT NULL
    )`);
    await queryRunner.query(
      'CREATE INDEX "IDX_COUPON_DISPATCH_OWNER" ON "core"."couponDispatch" ("workspaceId", "userWorkspaceId", "createdAt")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "core"."couponDispatch"');
  }
}
