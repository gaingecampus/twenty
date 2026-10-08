import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

// API imports create workspace-owned fields with fresh universal identifiers.
// Adopt only these known scheduling fields before standard sync tries to add them.
export const ADOPT_CAMPAIGN_SCHEDULING_FIELDS_SQL = `
DO $migration$
DECLARE
  candidate record;
BEGIN
  FOR candidate IN
    SELECT f.id, f."workspaceId", f.type, expected.type AS expected_type,
      expected.identifier::uuid AS identifier, o."applicationId"
    FROM core."fieldMetadata" f
    JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
      AND o."workspaceId" = f."workspaceId"
    JOIN core.application a ON a.id = o."applicationId"
      AND a."workspaceId" = o."workspaceId"
    JOIN (VALUES
      ('scheduledAt', 'DATE_TIME', '631b9334-b8b7-4548-bf67-0bd2f7e27ee8'),
      ('scheduleVersion', 'UUID', '3d6e6c3b-4f4c-448a-9889-da6fd065d5fa')
    ) AS expected(name, type, identifier) ON expected.name = f.name
    WHERE o."nameSingular" = 'messageCampaign'
      AND a."universalIdentifier" = '20202020-64aa-4b6f-b003-9c74b97cee20'
      AND (f."universalIdentifier" IS DISTINCT FROM expected.identifier::uuid
        OR f."applicationId" IS DISTINCT FROM o."applicationId")
  LOOP
    IF candidate.type::text <> candidate.expected_type THEN
      RAISE EXCEPTION 'Cannot adopt scheduling field %: incompatible type', candidate.id;
    END IF;
    IF EXISTS (
      SELECT 1 FROM core."fieldMetadata" other
      WHERE other."workspaceId" = candidate."workspaceId"
        AND other."universalIdentifier" = candidate.identifier
        AND other.id <> candidate.id
    ) THEN
      RAISE EXCEPTION 'Cannot adopt scheduling field %: identifier already exists', candidate.id;
    END IF;
    UPDATE core."fieldMetadata"
    SET "universalIdentifier" = candidate.identifier,
      "applicationId" = candidate."applicationId"
    WHERE id = candidate.id;
    UPDATE core.workspace SET "metadataVersion" = "metadataVersion" + 1
    WHERE id = candidate."workspaceId";
  END LOOP;
END $migration$;
`;

@RegisteredInstanceCommand('2.26.0', 1807500000000)
export class AdoptCampaignSchedulingFieldsFastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(ADOPT_CAMPAIGN_SCHEDULING_FIELDS_SQL);
  }

  async down(): Promise<void> {
    // Restoring imported identifiers would recreate the standard sync collision.
  }
}
