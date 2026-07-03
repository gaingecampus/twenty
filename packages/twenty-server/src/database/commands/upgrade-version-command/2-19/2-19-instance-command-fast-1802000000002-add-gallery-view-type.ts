import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.19.0', 1802000000002)
export class AddGalleryViewTypeFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "core"."view_type_enum" ADD VALUE IF NOT EXISTS 'GALLERY' AFTER 'CALENDAR'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"core\".\"view_type_enum_old\" AS ENUM('TABLE', 'KANBAN', 'CALENDAR', 'FIELDS_WIDGET', 'TABLE_WIDGET')",
    );
    await queryRunner.query(
      'ALTER TABLE "core"."view" ALTER COLUMN "type" DROP DEFAULT',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."view" ALTER COLUMN "type" TYPE "core"."view_type_enum_old" USING "type"::"text"::"core"."view_type_enum_old"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."view" ALTER COLUMN "type" SET DEFAULT \'TABLE\'',
    );
    await queryRunner.query('DROP TYPE "core"."view_type_enum"');
    await queryRunner.query(
      'ALTER TYPE "core"."view_type_enum_old" RENAME TO "view_type_enum"',
    );
  }
}
