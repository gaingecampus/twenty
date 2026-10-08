import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

export const ADD_MESSAGE_SENDING_STATUS_SQL = `
DO $migration$
DECLARE
  enum_row record;
BEGIN
  FOR enum_row IN
    SELECT n.nspname, t.typname
    FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype = 'e' AND t.typname = 'message_deliveryStatus_enum'
      AND n.nspname LIKE 'workspace\\_%' ESCAPE '\\'
  LOOP
    EXECUTE format('ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L',
      enum_row.nspname, enum_row.typname, 'SENDING');
  END LOOP;
END $migration$;

WITH changed AS (
  UPDATE core."fieldMetadata" f
  SET options = COALESCE(f.options, '[]'::jsonb) ||
    '[{"id":"ae71b61f-2e9c-48a3-8c75-e0bbd6614c58","value":"SENDING","label":"Sending","position":6,"color":"yellow"}]'::jsonb
  FROM core."objectMetadata" o
  WHERE f."objectMetadataId" = o.id AND o."nameSingular" = 'message'
    AND o."isSystem" = true AND f.name = 'deliveryStatus'
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(f.options, '[]'::jsonb)) option
      WHERE option->>'value' = 'SENDING'
    )
  RETURNING f."workspaceId"
)
UPDATE core.workspace SET "metadataVersion" = "metadataVersion" + 1
WHERE id IN (SELECT "workspaceId" FROM changed);
`;

@RegisteredInstanceCommand('2.25.0', 1807400000000)
export class AddMessageSendingStatusFastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(ADD_MESSAGE_SENDING_STATUS_SQL);
  }

  async down(): Promise<void> {
    // Keep this additive value: removing it could invalidate recorded delivery states.
  }
}
