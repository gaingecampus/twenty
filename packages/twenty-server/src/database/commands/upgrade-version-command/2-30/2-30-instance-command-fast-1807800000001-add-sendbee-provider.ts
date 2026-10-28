import { type QueryRunner } from 'typeorm';
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.30.0', 1807800000001)
export class AddSendbeeProviderFastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."couponDispatch" DROP CONSTRAINT IF EXISTS "couponDispatch_mode_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."couponDispatch" ADD CONSTRAINT "couponDispatch_mode_check" CHECK ("mode" IN ('SIMULATION', 'LIVE')), ADD COLUMN IF NOT EXISTS "provider" jsonb`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    // Refuse rollback when paid order history exists; never discard reconciliation records.
    await queryRunner.query(
      `ALTER TABLE "core"."couponDispatch" DROP CONSTRAINT "couponDispatch_mode_check", ADD CONSTRAINT "couponDispatch_mode_check" CHECK ("mode" = 'SIMULATION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."couponDispatch" DROP COLUMN "provider"`,
    );
  }
}
