import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.24.0', 1807200000000)
export class EnableFieldSummaryStorageCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "core"."keyValuePair_type_enum" ADD VALUE IF NOT EXISTS 'FIELD_SUMMARY'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot remove an enum value without recreating the type.
    // Keep the value so existing summaries remain readable after a rollback.
  }
}
