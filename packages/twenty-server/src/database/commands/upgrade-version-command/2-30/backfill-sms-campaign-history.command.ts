import { Command } from 'nest-commander';
import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTableName } from 'src/engine/utils/compute-table-name.util';
import { quoteAutomationSchema } from 'src/modules/gainge-automation/automation-schema';

// Run after standard-application sync, which installs the channel field and view.
// This command only links persisted history; it never enqueues or sends messages.
@Command({
  name: 'message-campaign:backfill-sms-history',
  description:
    'Link historical SMS dispatches to campaign records after standard sync.',
})
export class BackfillSmsCampaignHistoryCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!dataSource) throw new Error('Missing data source');
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.startTransaction();
      await runner.query("SET LOCAL lock_timeout='5s'");
      await runner.query("SET LOCAL statement_timeout='60s'");
      const objects: { name: string; custom: boolean }[] = await runner.query(
        `
        SELECT o."nameSingular" AS name, a."universalIdentifier" <> '20202020-64aa-4b6f-b003-9c74b97cee20'::uuid AS custom
        FROM core."objectMetadata" o JOIN core.application a ON a.id=o."applicationId" AND a."workspaceId"=o."workspaceId"
        WHERE o."workspaceId"=$1 AND o."nameSingular" IN ('messageCampaign','messageList')`,
        [workspaceId],
      );
      const campaign = objects.find((o) => o.name === 'messageCampaign');
      const list = objects.find((o) => o.name === 'messageList');
      if (!campaign || !list) {
        await runner.rollbackTransaction();
        return;
      }
      const schema = quoteAutomationSchema(getWorkspaceSchemaName(workspaceId));
      const campaigns = `${schema}.${quoteAutomationSchema(computeTableName(campaign.name, campaign.custom))}`;
      const lists = `${schema}.${quoteAutomationSchema(computeTableName(list.name, list.custom))}`;
      await runner.query(`UPDATE ${campaigns} c SET channel=p.channel FROM ${campaigns} source
        CROSS JOIN LATERAL jsonb_populate_record(NULL::${campaigns}, jsonb_build_object('channel', CASE WHEN source."draftData"->>'channel' IN ('email','sms','coupon') THEN upper(source."draftData"->>'channel') ELSE 'EMAIL' END)) p
        WHERE c.id=source.id AND c."deletedAt" IS NULL AND source."draftData"->>'channel' IN ('email','sms','coupon')
          AND c.channel::text IS DISTINCT FROM upper(source."draftData"->>'channel')`);
      // Cast through the target table's row type so enum status/channel columns
      // remain compatible with both standard and adopted workspace objects.
      const history = `SELECT s.*, CASE WHEN s.status <> 'FINISHED' THEN 'SENDING'
        WHEN jsonb_array_length(s.batches) > 0 AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(s.batches) b WHERE b->>'status' IS DISTINCT FROM 'ACCEPTED') THEN 'SENT'
        ELSE 'SENT_WITH_ERRORS' END AS campaign_status
        FROM core."smsDispatch" s WHERE s."workspaceId"=$1`;
      await runner.query(
        `WITH history AS (${history})
        UPDATE ${campaigns} c SET channel='SMS', status=p.status, "sentAt"=CASE WHEN h.status='FINISHED' THEN h."updatedAt" ELSE NULL END
        FROM history h CROSS JOIN LATERAL jsonb_populate_record(NULL::${campaigns}, jsonb_build_object('status',h.campaign_status)) p
        WHERE c."draftDispatchId"=h."requestId" AND c."deletedAt" IS NULL`,
        [workspaceId],
      );
      await runner.query(
        `WITH history AS (${history})
        INSERT INTO ${campaigns} (id,subject,"bodyTemplate","listId",status,channel,"draftDispatchId","createdAt","updatedAt","sentAt")
        SELECT h."requestId", COALESCE(NULLIF(h.subject,''),'문자 발송'), h.content, l.id, p.status, 'SMS', h."requestId",h."createdAt",h."updatedAt",
          CASE WHEN h.status='FINISHED' THEN h."updatedAt" ELSE NULL END
        FROM history h LEFT JOIN ${lists} l ON l.id=h."listId"
        CROSS JOIN LATERAL jsonb_populate_record(NULL::${campaigns}, jsonb_build_object('status',h.campaign_status)) p
        WHERE NOT EXISTS (SELECT 1 FROM ${campaigns} c WHERE c."draftDispatchId"=h."requestId" OR c.id=h."requestId")
        ON CONFLICT (id) DO NOTHING`,
        [workspaceId],
      );
      if (options.dryRun) await runner.rollbackTransaction();
      else await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    this.logger.log(
      'SMS campaign history reconciled without dispatching messages',
    );
  }
}
