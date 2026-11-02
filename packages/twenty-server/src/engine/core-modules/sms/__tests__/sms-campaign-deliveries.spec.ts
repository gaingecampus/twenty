import { ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { type Repository } from 'typeorm';
import { type CampaignDraftService } from 'src/modules/emailing/drafts/campaign-draft.service';
import { MessageCampaignWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-campaign.workspace-entity';
import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { resolveRolePermissionConfig } from 'src/engine/twenty-orm/utils/resolve-role-permission-config.util';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type GaingeSmsService } from '../gainge-sms.service';
import { type SmsDispatchEntity } from '../sms-dispatch.entity';
import { SmsCampaignDeliveriesInput } from '../sms-campaign-deliveries.dto';
import { SmsService } from '../sms.service';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({ getWorkspaceContext: () => ({}) }),
);
jest.mock(
  'src/engine/twenty-orm/utils/resolve-role-permission-config.util',
  () => ({ resolveRolePermissionConfig: jest.fn() }),
);

describe('SMS campaign delivery history', () => {
  const findCampaign = jest.fn();
  const findDispatch = jest.fn();
  const getRepository = jest.fn();
  const settings = jest.fn();
  const service = new SmsService(
    { findOneBy: findDispatch } as unknown as Repository<SmsDispatchEntity>,
    {
      executeInWorkspaceContext: (callback: () => unknown) => callback(),
      getRepository,
    } as unknown as GlobalWorkspaceOrmManager,
    { settings } as unknown as GaingeSmsService,
    {} as MessageQueueService,
    {} as CampaignDraftService,
  );
  const input = { campaignId: 'saved-draft', offset: 0, limit: 20 };
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(resolveRolePermissionConfig)
      .mockReturnValue({ intersectionOf: ['reader-role'] });
    getRepository.mockResolvedValue({ findOne: findCampaign });
    findCampaign.mockResolvedValue({
      id: input.campaignId,
      channel: 'SMS',
      draftDispatchId: 'request',
    });
    findDispatch.mockResolvedValue({
      id: 'dispatch',
      createdAt: new Date('2026-11-02T00:00:00Z'),
      // The sender need not be the user reading an authorized shared campaign.
      userWorkspaceId: 'other-member',
      batches: [
        {
          status: 'ACCEPTED',
          targets: [
            {
              personId: 'customer',
              name: '수신자',
              to: '01012345678',
              messageType: 'SMS',
            },
          ],
        },
        {
          status: 'UNKNOWN',
          error: '접수 확인 필요',
          targets: [
            { name: '다음 수신자', to: '01023456789', messageType: 'LMS' },
          ],
        },
      ],
    });
  });
  it('reads historical targets using the authorized campaign request id and workspace, without SMS configuration', async () => {
    const result = await service.campaignDeliveries('workspace', input);
    expect(getRepository).toHaveBeenCalledWith(
      'workspace',
      MessageCampaignWorkspaceEntity,
      { intersectionOf: ['reader-role'] },
    );
    expect(findCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'saved-draft' } }),
    );
    expect(findDispatch).toHaveBeenCalledWith({
      workspaceId: 'workspace',
      requestId: 'request',
    });
    expect(result).toMatchObject({
      totalCount: 2,
      records: [
        {
          id: 'dispatch:0:0',
          personId: 'customer',
          name: '수신자',
          phone: '01012345678',
          status: 'ACCEPTED',
          messageType: 'SMS',
        },
        {
          id: 'dispatch:1:0',
          status: 'UNKNOWN',
          messageType: 'LMS',
          error: '접수 확인 필요',
        },
      ],
    });
    expect(settings).not.toHaveBeenCalled();
  });
  it('paginates across batch boundaries and keeps the full recipient count', async () => {
    expect(
      await service.campaignDeliveries('workspace', {
        ...input,
        offset: 1,
        limit: 1,
      }),
    ).toMatchObject({ totalCount: 2, records: [{ id: 'dispatch:1:0' }] });
    expect(
      await service.campaignDeliveries('workspace', { ...input, offset: 2 }),
    ).toEqual({ totalCount: 2, records: [] });
  });
  it('does not expose core snapshots for deleted, unknown or inaccessible campaigns', async () => {
    findCampaign.mockResolvedValue(null);
    await expect(
      service.campaignDeliveries('workspace', input),
    ).rejects.toThrow(ForbiddenException);
    expect(findDispatch).not.toHaveBeenCalled();
  });
  it('propagates permission denial before reading the dispatch', async () => {
    getRepository.mockRejectedValue(new ForbiddenException());
    await expect(
      service.campaignDeliveries('workspace', input),
    ).rejects.toThrow(ForbiddenException);
    expect(findDispatch).not.toHaveBeenCalled();
  });
  it('requires a role permission context', async () => {
    jest.mocked(resolveRolePermissionConfig).mockReturnValue(null);
    await expect(
      service.campaignDeliveries('workspace', input),
    ).rejects.toThrow(ForbiddenException);
    expect(getRepository).not.toHaveBeenCalled();
    expect(findDispatch).not.toHaveBeenCalled();
  });
  it.each([
    { channel: 'EMAIL', draftDispatchId: 'request' },
    { channel: 'SMS', draftDispatchId: null },
  ])(
    'does not query dispatches for campaigns without an SMS request: %p',
    async (campaign) => {
      findCampaign.mockResolvedValue(campaign);
      expect(await service.campaignDeliveries('workspace', input)).toEqual({
        totalCount: 0,
        records: [],
      });
      expect(findDispatch).not.toHaveBeenCalled();
    },
  );
  it('does not cross workspaces when the matching dispatch is absent', async () => {
    findDispatch.mockResolvedValue(null);
    expect(
      await service.campaignDeliveries('another-workspace', input),
    ).toEqual({ totalCount: 0, records: [] });
    expect(findDispatch).toHaveBeenCalledWith({
      workspaceId: 'another-workspace',
      requestId: 'request',
    });
  });
  it.each([
    { offset: -1 },
    { limit: 0 },
    { limit: 101 },
    { offset: 0.5 },
    { campaignId: 'invalid' },
  ])('rejects invalid pagination and ids: %p', async (invalid) => {
    const value = Object.assign(
      new SmsCampaignDeliveriesInput(),
      {
        campaignId: '2aaf8523-59b6-4c32-aba7-6116d449231d',
        offset: 0,
        limit: 20,
      },
      invalid,
    );
    expect((await validate(value)).length).toBeGreaterThan(0);
  });
});
