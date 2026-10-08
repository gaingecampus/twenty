import { Client } from 'pg';

import { ADOPT_CAMPAIGN_SCHEDULING_FIELDS_SQL } from 'src/database/commands/upgrade-version-command/2-26/2-26-instance-command-fast-1807500000000-adopt-campaign-scheduling-fields';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithDatabase('adopt imported campaign scheduling fields', () => {
  let client: Client;
  const sql = ADOPT_CAMPAIGN_SCHEDULING_FIELDS_SQL.replace(
    /core\./g,
    'pg_temp.',
  );

  beforeEach(async () => {
    jest.useRealTimers();
    client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await client.connect();
    await client.query('BEGIN');
    await client.query(`
      CREATE TEMP TABLE workspace (id text, "metadataVersion" integer);
      CREATE TEMP TABLE application (id text, "workspaceId" text, "universalIdentifier" uuid);
      CREATE TEMP TABLE "objectMetadata" (id text, "workspaceId" text, "applicationId" text, "nameSingular" text);
      CREATE TEMP TABLE "fieldMetadata" (id text, "workspaceId" text, "objectMetadataId" text, "applicationId" text, "universalIdentifier" uuid, name text, type text, label text);
      INSERT INTO workspace VALUES ('workspace', 10);
      INSERT INTO application VALUES ('standard', 'workspace', '20202020-64aa-4b6f-b003-9c74b97cee20');
      INSERT INTO "objectMetadata" VALUES ('campaign', 'workspace', 'standard', 'messageCampaign');
      INSERT INTO "fieldMetadata" VALUES
        ('scheduled', 'workspace', 'campaign', 'custom', '2baef1cb-405c-400f-bee1-72cbaa95aeec', 'scheduledAt', 'DATE_TIME', '예약 발송일'),
        ('version', 'workspace', 'campaign', 'custom', '00000000-0000-4000-8000-000000000001', 'scheduleVersion', 'UUID', '예약 버전');
      CREATE TEMP TABLE campaign ("scheduledAt" timestamptz, "scheduleVersion" uuid);
      INSERT INTO campaign VALUES ('2026-10-29T04:46:00Z', '00000000-0000-4000-8000-000000000002');
    `);
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    await client.end();
  });

  it('preserves field IDs, Korean labels and campaign data', async () => {
    const before = await client.query('SELECT * FROM campaign');
    await client.query(sql);
    const fields = await client.query(
      'SELECT id, "applicationId", "universalIdentifier", label FROM "fieldMetadata" ORDER BY id',
    );

    expect(fields.rows).toEqual([
      {
        id: 'scheduled',
        applicationId: 'standard',
        universalIdentifier: '631b9334-b8b7-4548-bf67-0bd2f7e27ee8',
        label: '예약 발송일',
      },
      {
        id: 'version',
        applicationId: 'standard',
        universalIdentifier: '3d6e6c3b-4f4c-448a-9889-da6fd065d5fa',
        label: '예약 버전',
      },
    ]);
    expect((await client.query('SELECT * FROM campaign')).rows).toEqual(
      before.rows,
    );
  });

  it('is idempotent', async () => {
    await client.query(sql);
    const before = await client.query('SELECT * FROM workspace');
    await client.query(sql);
    expect((await client.query('SELECT * FROM workspace')).rows).toEqual(
      before.rows,
    );
  });

  it('rejects incompatible field types', async () => {
    await client.query(`UPDATE "fieldMetadata" SET type = 'TEXT'`);
    await expect(client.query(sql)).rejects.toThrow('incompatible type');
  });

  it('leaves custom objects unchanged', async () => {
    await client.query(`UPDATE "objectMetadata" SET "applicationId" = 'custom'`);
    await client.query(sql);
    const result = await client.query('SELECT "metadataVersion" FROM workspace');
    expect(result.rows[0].metadataVersion).toBe(10);
  });

  it('rejects an identifier already owned by another field', async () => {
    await client.query(`
      INSERT INTO "fieldMetadata" (id, "workspaceId", "universalIdentifier")
      VALUES ('other', 'workspace', '631b9334-b8b7-4548-bf67-0bd2f7e27ee8');
    `);
    await expect(client.query(sql)).rejects.toThrow('identifier already exists');
  });
});
