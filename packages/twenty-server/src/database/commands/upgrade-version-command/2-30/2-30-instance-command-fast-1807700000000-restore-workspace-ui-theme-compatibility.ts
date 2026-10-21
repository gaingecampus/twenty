import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.30.0', 1807700000000)
export class RestoreWorkspaceUiThemeCompatibilityFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Also repair installations that already executed the original 2.29 drop.
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ADD COLUMN IF NOT EXISTS "uiTheme" character varying NOT NULL DEFAULT 'enterprise'`,
    );
  }

  public async down(): Promise<void> {
    // Retain this compatibility column on rollback as well.
  }
}
