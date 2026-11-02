import { type WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { AggregateOperations } from 'twenty-shared/types';

import { type CouponDispatchEntity } from 'src/engine/core-modules/coupon/coupon-dispatch.entity';
import { type SmsDispatchEntity } from 'src/engine/core-modules/sms/sms-dispatch.entity';
import { type GlobalWorkspaceDataSource } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource';
import { CampaignRecipientCountService } from '../campaign-recipient-count.service';
import { isCampaignRecipientCount } from '../utils/is-campaign-recipient-count.util';

const createQuery = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue([]),
});

describe('Campaign recipient COUNT across channels', () => {
  const sms = createQuery();
  const coupon = createQuery();
  const find = jest.fn();
  const getRepository = jest.fn(() => ({ find }));
  const service = new CampaignRecipientCountService(
    {
      createQueryBuilder: () => sms,
    } as unknown as WorkspaceScopedRepository<SmsDispatchEntity>,
    {
      createQueryBuilder: () => coupon,
    } as unknown as WorkspaceScopedRepository<CouponDispatchEntity>,
  );
  const input = {
    workspaceId: 'workspace',
    parentRecordIds: ['email', 'sms', 'coupon'],
    workspaceDataSource: {
      getRepository,
    } as unknown as GlobalWorkspaceDataSource,
    rolePermissionConfig: { intersectionOf: ['reader'] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    find.mockResolvedValue([
      { id: 'email', channel: 'EMAIL', draftDispatchId: null },
      { id: 'sms', channel: 'SMS', draftDispatchId: 'sms-request' },
      { id: 'coupon', channel: 'COUPON', draftDispatchId: 'coupon-quote' },
    ]);
    sms.getRawMany.mockResolvedValue([
      { dispatchId: 'sms-request', count: '101' },
    ]);
    coupon.getRawMany.mockResolvedValue([
      { dispatchId: 'coupon-quote', count: 3 },
    ]);
  });

  it('counts immutable dispatch targets in bulk and preserves the email participant aggregate', async () => {
    const result = await service.count(input);

    expect(Object.fromEntries(result)).toEqual({ sms: 101, coupon: 3 });
    expect(getRepository).toHaveBeenCalledWith(
      'messageCampaign',
      input.rolePermissionConfig,
    );
    expect(find.mock.calls[0][0].where.id.value).toEqual(input.parentRecordIds);
    expect(sms.where).toHaveBeenCalledWith(
      'dispatch."workspaceId" = :workspaceId',
      { workspaceId: 'workspace' },
    );
    expect(coupon.where).toHaveBeenCalledWith(
      'dispatch."workspaceId" = :workspaceId',
      { workspaceId: 'workspace' },
    );
    expect(sms.andWhere).toHaveBeenCalledWith(
      'dispatch."requestId" IN (:...dispatchIds)',
      { dispatchIds: ['sms-request'] },
    );
    expect(coupon.andWhere).toHaveBeenCalledWith(
      'dispatch.id IN (:...dispatchIds)',
      { dispatchIds: ['coupon-quote'] },
    );
    expect(sms.getRawMany).toHaveBeenCalledTimes(1);
    expect(coupon.getRawMany).toHaveBeenCalledTimes(1);
    // No status restriction: a failed/unknown batch is still part of the sent audience.
    expect(sms.addSelect.mock.calls[0][0]).toContain(
      "jsonb_array_length(batch->'targets')",
    );
    expect(coupon.addSelect.mock.calls[0][0]).toBe(
      'jsonb_array_length(dispatch.recipients)',
    );
  });

  it('does not query core dispatches for inaccessible, deleted or unlinked draft campaigns', async () => {
    find.mockResolvedValue([
      { id: 'draft', channel: 'SMS', draftDispatchId: null },
    ]);
    expect((await service.count(input)).size).toBe(0);
    expect(sms.getRawMany).not.toHaveBeenCalled();
    expect(coupon.getRawMany).not.toHaveBeenCalled();
  });

  it('does not bypass missing permission configuration', async () => {
    expect(
      (await service.count({ ...input, rolePermissionConfig: null })).size,
    ).toBe(0);
    expect(getRepository).not.toHaveBeenCalled();
  });

  it('propagates permission failures without querying core dispatches', async () => {
    find.mockRejectedValueOnce(new Error('Forbidden'));
    await expect(service.count(input)).rejects.toThrow('Forbidden');
    expect(sms.getRawMany).not.toHaveBeenCalled();
  });

  it('distinguishes a recorded zero from missing historical dispatch data', async () => {
    sms.getRawMany.mockResolvedValue([
      { dispatchId: 'sms-request', count: '0' },
    ]);
    coupon.getRawMany.mockResolvedValue([]);
    expect(Object.fromEntries(await service.count(input))).toEqual({ sms: 0 });
  });

  it('maps saved drafts by request ID instead of assuming campaign and dispatch IDs match', async () => {
    find.mockResolvedValue([
      { id: 'saved-draft', channel: 'SMS', draftDispatchId: 'sms-request' },
      { id: 'second-record', channel: 'SMS', draftDispatchId: 'sms-request' },
    ]);
    expect(Object.fromEntries(await service.count(input))).toEqual({
      'saved-draft': 101,
      'second-record': 101,
    });
    expect(sms.andWhere.mock.calls[0][1]).toEqual({
      dispatchIds: ['sms-request'],
    });
  });

  const rollup = {
    rollupKey: 'recipients-count',
    relationFieldMetadataUniversalIdentifier: 'field',
    aggregateOperation: AggregateOperations.COUNT,
  };
  const match = {
    parentObjectName: 'messageCampaign',
    relationFieldName: 'recipients',
    rollup,
  };

  it('uses channel-aware counts only for the unfiltered campaign recipient COUNT', () => {
    expect(isCampaignRecipientCount(match)).toBe(true);
    expect(
      isCampaignRecipientCount({ ...match, rollup: { ...rollup, filter: {} } }),
    ).toBe(true);
    expect(
      isCampaignRecipientCount({ ...match, parentObjectName: 'messageList' }),
    ).toBe(false);
    expect(
      isCampaignRecipientCount({ ...match, relationFieldName: 'messages' }),
    ).toBe(false);
    expect(
      isCampaignRecipientCount({
        ...match,
        rollup: { ...rollup, aggregateOperation: AggregateOperations.SUM },
      }),
    ).toBe(false);
    expect(
      isCampaignRecipientCount({
        ...match,
        rollup: { ...rollup, filter: { role: { eq: 'to' } } },
      }),
    ).toBe(false);
  });
});
