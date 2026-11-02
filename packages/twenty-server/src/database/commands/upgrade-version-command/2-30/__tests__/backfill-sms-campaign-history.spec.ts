import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { BackfillSmsCampaignHistoryCommand } from '../backfill-sms-campaign-history.command';
import { type WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

jest.mock(
  'src/database/commands/command-runners/active-or-suspended-workspace.command-runner',
  () => ({
    ActiveOrSuspendedWorkspaceCommandRunner: class {
      logger = { log: jest.fn() };
    },
  }),
);
jest.mock(
  'src/database/commands/command-runners/workspace-iterator.service',
  () => ({ WorkspaceIteratorService: class {} }),
);

// Opt-in PostgreSQL check. All rows live in a disposable schema, never core tables.
const postgresTest = process.env.GAINGE_TEST_PG_URL ? it : it.skip;
postgresTest(
  'backfills once, preserves draft links and deletions, and scopes by workspace with enum columns',
  async () => {
    const client = new Client({
      connectionString: process.env.GAINGE_TEST_PG_URL,
    });
    await client.connect();
    const workspaceId = randomUUID();
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;
    const request = randomUUID(),
      draftRequest = randomUUID(),
      deletedRequest = randomUUID(),
      foreignRequest = randomUUID(),
      draftId = randomUUID();
    try {
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(
        `CREATE TYPE ${schema}.channel AS ENUM ('EMAIL','SMS','COUPON'); CREATE TYPE ${schema}.status AS ENUM ('DRAFT','SENDING','SENT','SENT_WITH_ERRORS')`,
      );
      await client.query(`CREATE TABLE ${schema}."messageList" (id uuid PRIMARY KEY);
      CREATE TABLE ${schema}."messageCampaign" (id uuid PRIMARY KEY, subject text, "bodyTemplate" text, "listId" uuid REFERENCES ${schema}."messageList", status ${schema}.status DEFAULT 'DRAFT', channel ${schema}.channel DEFAULT 'EMAIL', "draftDispatchId" uuid, "draftData" jsonb, "createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now(), "sentAt" timestamptz, "deletedAt" timestamptz);
      CREATE TABLE ${schema}."smsDispatch" ("requestId" uuid PRIMARY KEY, "workspaceId" uuid, subject text, content text, "listId" uuid, status text, batches jsonb, "createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now())`);
      for (const [id, ws] of [
        [request, workspaceId],
        [draftRequest, workspaceId],
        [deletedRequest, workspaceId],
        [foreignRequest, randomUUID()],
      ]) {
        await client.query(
          `INSERT INTO ${schema}."smsDispatch" ("requestId","workspaceId",subject,content,status,batches) VALUES ($1,$2,'안내','본문','FINISHED','[{"status":"ACCEPTED"}]')`,
          [id, ws],
        );
      }
      await client.query(
        `INSERT INTO ${schema}."messageCampaign" (id,"draftDispatchId","draftData") VALUES ($1,$2,'{"channel":"sms"}')`,
        [draftId, draftRequest],
      );
      await client.query(
        `INSERT INTO ${schema}."messageCampaign" (id,"draftDispatchId","deletedAt") VALUES ($1,$1,now())`,
        [deletedRequest],
      );
      const runner = {
        connect: async () => {},
        release: async () => {},
        isTransactionActive: true,
        startTransaction: () => client.query('BEGIN'),
        commitTransaction: () => client.query('COMMIT'),
        rollbackTransaction: () => client.query('ROLLBACK'),
        query: async (sql: string, params?: unknown[]) => {
          if (sql.includes('FROM core."objectMetadata"'))
            return [
              { name: 'messageCampaign', custom: false },
              { name: 'messageList', custom: false },
            ];
          return (
            await client.query(
              sql.split('core."smsDispatch"').join(`${schema}."smsDispatch"`),
              params,
            )
          ).rows;
        },
      };
      const command = new BackfillSmsCampaignHistoryCommand(
        {} as WorkspaceIteratorService,
      );
      const execute = (dryRun = false) =>
        command.runOnWorkspace({
          workspaceId,
          dataSource: { createQueryRunner: () => runner },
          options: { dryRun },
        } as unknown as RunOnWorkspaceArgs);
      await execute(true);
      expect(
        (
          await client.query(
            `SELECT count(*)::int AS count FROM ${schema}."messageCampaign"`,
          )
        ).rows[0].count,
      ).toBe(2);
      await execute();
      await execute();
      const records = (
        await client.query(
          `SELECT id,channel,status,"sentAt","deletedAt" FROM ${schema}."messageCampaign"`,
        )
      ).rows;
      expect(records).toHaveLength(3);
      expect(records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: request,
            channel: 'SMS',
            status: 'SENT',
            sentAt: expect.any(Date),
          }),
          expect.objectContaining({
            id: draftId,
            channel: 'SMS',
            status: 'SENT',
          }),
          expect.objectContaining({
            id: deletedRequest,
            deletedAt: expect.any(Date),
          }),
        ]),
      );
      expect(
        records.some(
          (row) => row.id === foreignRequest || row.id === draftRequest,
        ),
      ).toBe(false);
    } finally {
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await client.end();
    }
  },
);
