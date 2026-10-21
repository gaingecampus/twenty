import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.29.0', 1807600000000)
export class DropWorkspaceUiThemeFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Keep the registration for migration history, but retain the column while
    // pre-2.29 servers can still be running during an upgrade or rollback.
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ADD COLUMN IF NOT EXISTS "uiTheme" character varying NOT NULL DEFAULT 'enterprise'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ADD COLUMN IF NOT EXISTS "uiTheme" character varying NOT NULL DEFAULT 'enterprise'`,
    );
  }
}
