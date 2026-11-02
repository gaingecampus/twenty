import { Injectable } from '@nestjs/common';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { In } from 'typeorm';

import { CouponDispatchEntity } from 'src/engine/core-modules/coupon/coupon-dispatch.entity';
import { SmsDispatchEntity } from 'src/engine/core-modules/sms/sms-dispatch.entity';
import { GlobalWorkspaceDataSource } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource';
import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config';
import { type MessageCampaignWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-campaign.workspace-entity';

// SMS/coupon recipients live in immutable dispatch snapshots, not email participants.
// Read counts only: never create synthetic emails or expose recipient PII.
@Injectable()
export class CampaignRecipientCountService {
  constructor(
    @InjectWorkspaceScopedRepository(SmsDispatchEntity)
    private readonly smsDispatches: WorkspaceScopedRepository<SmsDispatchEntity>,
    @InjectWorkspaceScopedRepository(CouponDispatchEntity)
    private readonly couponDispatches: WorkspaceScopedRepository<CouponDispatchEntity>,
  ) {}

  async count({
    workspaceId,
    parentRecordIds,
    workspaceDataSource,
    rolePermissionConfig,
  }: {
    workspaceId: string;
    parentRecordIds: string[];
    workspaceDataSource: GlobalWorkspaceDataSource;
    rolePermissionConfig: RolePermissionConfig | null;
  }): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    if (!rolePermissionConfig || parentRecordIds.length === 0) return counts;

    // Permission-aware parent lookup prevents guessed campaign IDs from exposing
    // counts from inaccessible/deleted campaigns, even in the same workspace.
    const campaigns = await workspaceDataSource
      .getRepository<MessageCampaignWorkspaceEntity>(
        'messageCampaign',
        rolePermissionConfig,
      )
      .find({
        where: { id: In(parentRecordIds) },
        select: { id: true, channel: true, draftDispatchId: true },
      });

    for (const channel of ['SMS', 'COUPON'] as const) {
      const linkedCampaigns = campaigns.filter(
        (campaign) => campaign.channel === channel && campaign.draftDispatchId,
      );
      const dispatchIds = [
        ...new Set(
          linkedCampaigns.map((campaign) => campaign.draftDispatchId!),
        ),
      ];

      if (dispatchIds.length === 0) continue;

      // Aggregate in PostgreSQL rather than loading phone numbers, names or bodies.
      const query =
        channel === 'SMS'
          ? this.smsDispatches
              .createQueryBuilder('dispatch')
              .select('dispatch."requestId"', 'dispatchId')
              .addSelect(
                `(SELECT COALESCE(SUM(jsonb_array_length(batch->'targets')), 0)
                FROM jsonb_array_elements(dispatch.batches) batch)`,
                'count',
              )
          : this.couponDispatches
              .createQueryBuilder('dispatch')
              .select('dispatch.id', 'dispatchId')
              .addSelect('jsonb_array_length(dispatch.recipients)', 'count');
      const rows = await query
        .where('dispatch."workspaceId" = :workspaceId', { workspaceId })
        .andWhere(
          channel === 'SMS'
            ? 'dispatch."requestId" IN (:...dispatchIds)'
            : 'dispatch.id IN (:...dispatchIds)',
          { dispatchIds },
        )
        .getRawMany<{ dispatchId: string; count: string | number }>();
      const byDispatchId = new Map(
        rows.map((row) => [row.dispatchId, Number(row.count)]),
      );

      for (const campaign of linkedCampaigns) {
        const count = byDispatchId.get(campaign.draftDispatchId!);

        if (count !== undefined) counts.set(campaign.id, count);
      }
    }

    return counts;
  }
}
