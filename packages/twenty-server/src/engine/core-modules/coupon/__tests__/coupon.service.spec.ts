import { type SendbeeClient } from '../sendbee.client';
import { type SecretEncryptionService } from '../../secret-encryption/secret-encryption.service';
import { type Repository } from 'typeorm';
import { validate } from 'class-validator';

import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { CouponDispatchEntity } from '../coupon-dispatch.entity';
import { CouponPreviewInput } from '../coupon.dto';
import { CouponService } from '../coupon.service';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({ getWorkspaceContext: () => ({}) }),
);
jest.mock(
  'src/engine/twenty-orm/utils/resolve-role-permission-config.util',
  () => ({
    resolveRolePermissionConfig: () => ({
      shouldBypassPermissionChecks: false,
    }),
  }),
);

describe('coupon review and simulation', () => {
  const provider = {
    available: () => false,
    settings: () => {
      throw new Error('실제 발송 설정 없음');
    },
  } as unknown as SendbeeClient;
  const encryption = {} as SecretEncryptionService;
  let service: CouponService;
  let row: CouponDispatchEntity;
  const save = jest.fn();
  const findOne = jest.fn();
  const find = jest.fn();
  const input: CouponPreviewInput = {
    mode: 'SIMULATION',
    testPhone: '01012345678',
    productId: 'SIM-COFFEE',
    message: '테스트',
    scenario: 'SUCCESS',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    row = Object.assign(new CouponDispatchEntity(), {
      id: 'quote',
      workspaceId: 'workspace',
      userWorkspaceId: 'actor',
      mode: 'SIMULATION',
      status: 'PREVIEW',
      scenario: 'SUCCESS',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 600000),
      product: {
        id: 'SIM-COFFEE',
        name: '테스트',
        price: 5000,
        validityDays: 30,
      },
      recipients: [
        { personId: null, phone: '010-****-5678', status: 'PREVIEW' },
      ],
      message: '테스트',
      total: 1,
      missing: 0,
      duplicates: 0,
      estimatedCost: 5000,
    });
    save.mockImplementation(async (value: CouponDispatchEntity) =>
      Object.assign(value, { id: 'quote', createdAt: new Date() }),
    );
    findOne.mockResolvedValue(row);
    find.mockResolvedValue([]);
    const repository = {
      create: (value: object) =>
        Object.assign(new CouponDispatchEntity(), value),
      save,
      findOne,
      find,
      manager: {
        transaction: (callback: (manager: object) => unknown) =>
          callback({ getRepository: () => repository }),
      },
    } as unknown as Repository<CouponDispatchEntity>;
    service = new CouponService(
      repository,
      {} as GlobalWorkspaceOrmManager,
      provider,
      encryption,
    );
  });

  it('stores an immutable quote with masked recipients and server-owned prices', async () => {
    const result = await service.preview('workspace', 'actor', input);
    expect(result).toMatchObject({
      mode: 'SIMULATION',
      status: 'PREVIEW',
      estimatedCost: 5000,
      recipientCount: 1,
    });
    expect(save.mock.calls[0][0]).toMatchObject({
      workspaceId: 'workspace',
      userWorkspaceId: 'actor',
      recipients: [{ phone: '010-****-5678' }],
    });
    expect(JSON.stringify(save.mock.calls)).not.toContain('01012345678');
  });

  it('never permits live mode or unknown supplier product codes', async () => {
    await expect(
      service.preview('workspace', 'actor', { ...input, mode: 'LIVE' }),
    ).rejects.toThrow('실제');
    await expect(
      service.preview('workspace', 'actor', {
        ...input,
        productId: 'G00000222122',
      }),
    ).rejects.toThrow('상품');
    expect(save).not.toHaveBeenCalled();
    expect((await service.capabilities('workspace')).liveAvailable).toBe(false);
  });

  it('rejects ambiguous, missing and invalid recipients', async () => {
    await expect(
      service.preview('workspace', 'actor', { ...input, listId: 'list' }),
    ).rejects.toThrow('하나만');
    await expect(
      service.preview('workspace', 'actor', { ...input, testPhone: '' }),
    ).rejects.toThrow('하나만');
    await expect(
      service.preview('workspace', 'actor', { ...input, testPhone: 'invalid' }),
    ).rejects.toThrow('유효한');
  });

  it.each([
    ['SUCCESS', 'SIMULATED'],
    ['DELIVERY_FAILED', 'SIMULATED_FAILED'],
    ['INSUFFICIENT_BALANCE', 'SIMULATED_FAILED'],
    ['UNKNOWN', 'UNKNOWN'],
  ] as const)(
    'reproduces %s without reporting actual delivery',
    async (scenario, status) => {
      row.scenario = scenario;
      const result = await service.simulate('workspace', 'actor', 'quote');
      expect(result.status).toBe(status);
      expect(result.recipients[0].status).toBe(status);
    },
  );

  it('does not run completed or unknown quotes again', async () => {
    row.scenario = 'UNKNOWN';
    await service.simulate('workspace', 'actor', 'quote');
    await service.simulate('workspace', 'actor', 'quote');
    expect(save).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      where: {
        id: 'quote',
        workspaceId: 'workspace',
        userWorkspaceId: 'actor',
      },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('rejects stale quotes and budget overruns', async () => {
    row.expiresAt = new Date(Date.now() - 1);
    await expect(
      service.simulate('workspace', 'actor', 'quote'),
    ).rejects.toThrow('유효시간');
    row.expiresAt = new Date(Date.now() + 600000);
    row.estimatedCost = 100001;
    await expect(
      service.simulate('workspace', 'actor', 'quote'),
    ).rejects.toThrow('예산');
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects an inaccessible quote and scopes history to workspace and actor', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.simulate('other', 'other', 'quote')).rejects.toThrow(
      '권한',
    );
    await service.history('workspace', 'actor');
    expect(find).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace', userWorkspaceId: 'actor' },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  });

  it('validates the public input boundary', async () => {
    const errors = await validate(
      Object.assign(new CouponPreviewInput(), {
        ...input,
        mode: 'INVALID',
        scenario: 'INVALID',
        message: 'x'.repeat(501),
      }),
    );
    expect(errors.map((error) => error.property).sort()).toEqual([
      'message',
      'mode',
      'scenario',
    ]);
  });

  it('resolves list members through caller permissions and retains exclusion counts', async () => {
    const getRepository = jest
      .fn()
      .mockResolvedValueOnce({ findOne: async () => ({ id: 'list' }) })
      .mockResolvedValueOnce({
        find: async () => [
          { personId: 'a' },
          { personId: 'a' },
          { personId: 'hidden' },
          { workspaceMemberId: 'member' },
        ],
      })
      .mockResolvedValueOnce({
        find: async () => [
          { id: 'a', phones: { primaryPhoneNumber: '01012345678' } },
        ],
      });
    const orm = {
      executeInWorkspaceContext: (callback: () => unknown) => callback(),
      getRepository,
    } as unknown as GlobalWorkspaceOrmManager;
    const repository = {
      create: (value: object) =>
        Object.assign(new CouponDispatchEntity(), value),
      save,
    } as unknown as Repository<CouponDispatchEntity>;
    const scopedService = new CouponService(
      repository,
      orm,
      provider,
      encryption,
    );
    const result = await scopedService.preview('workspace', 'actor', {
      ...input,
      testPhone: undefined,
      listId: 'list',
    });
    expect(result).toMatchObject({
      total: 4,
      missing: 2,
      duplicates: 1,
      recipientCount: 1,
    });
    expect(
      getRepository.mock.calls.every(
        (call) =>
          call[0] === 'workspace' &&
          call[2].shouldBypassPermissionChecks === false,
      ),
    ).toBe(true);
  });
});
