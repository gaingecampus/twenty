import { type Repository } from 'typeorm';
import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type SecretEncryptionService } from '../../secret-encryption/secret-encryption.service';
import { CouponDispatchEntity } from '../coupon-dispatch.entity';
import { CouponService } from '../coupon.service';
import { type SendbeeClient } from '../sendbee.client';

const config = {
  mid: 'test',
  environment: 'development',
  senderName: '가인지 CRM',
  maxOrderAmount: 10000,
};
const product = { id: 'G1', name: '쿠폰', price: 5000, validityDays: 30 };

describe('durable coupon orders', () => {
  let service: CouponService;
  let row: CouponDispatchEntity;
  let persisted: CouponDispatchEntity;
  const order = jest.fn();
  const status = jest.fn();
  const products = jest.fn();
  const settings = jest.fn();
  const save = jest.fn();
  const findOne = jest.fn();
  const encryption = {
    encryptVersioned: jest.fn(() => 'encrypted-number'),
    decryptVersionedOrThrow: jest.fn(() => '01012345678'),
  };

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    row = Object.assign(new CouponDispatchEntity(), {
      id: 'quote',
      workspaceId: 'workspace',
      userWorkspaceId: 'actor',
      mode: 'LIVE',
      status: 'PREVIEW',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 600000),
      product,
      provider: { ...config, orderTrId: 'test_fixed', title: '선물' },
      recipients: [
        {
          personId: null,
          phone: '010-****-5678',
          encryptedPhone: 'encrypted-number',
          status: 'PREVIEW',
        },
      ],
      scenario: 'SUCCESS',
      message: '감사합니다',
      total: 1,
      missing: 0,
      duplicates: 0,
      estimatedCost: 5000,
    });
    persisted = structuredClone(row);
    settings.mockReturnValue(config);
    products.mockResolvedValue([product]);
    order.mockResolvedValue({
      orderId: 'order1',
      totalPrice: 5000,
      status: 'PROCESSING',
      coupons: [
        { phone: '01012345678', transactionId: 't1', status: 'PROCESSING' },
      ],
    });
    status.mockResolvedValue({
      orderId: 'order1',
      totalPrice: 5000,
      status: 'SENT',
      coupons: [
        { phone: '01012345678', transactionId: 't1', status: 'AVAILABLE' },
      ],
    });
    save.mockImplementation(async (value: CouponDispatchEntity) => {
      persisted = structuredClone(value);
      return value;
    });
    findOne.mockImplementation(
      async ({
        where,
      }: {
        where: { workspaceId: string; userWorkspaceId: string };
      }) =>
        where.workspaceId === 'workspace' && where.userWorkspaceId === 'actor'
          ? row
          : null,
    );
    let previous = Promise.resolve();
    const repository = {
      save,
      findOne,
      create: (value: object) =>
        Object.assign(
          new CouponDispatchEntity(),
          { id: 'quote', createdAt: new Date() },
          value,
        ),
      manager: {
        transaction: (callback: (manager: object) => Promise<unknown>) => {
          const next = previous.then(() =>
            callback({ getRepository: () => repository }),
          );
          previous = next.then(
            () => undefined,
            () => undefined,
          );
          return next;
        },
      },
    } as unknown as Repository<CouponDispatchEntity>;
    service = new CouponService(
      repository,
      {
        executeInWorkspaceContext: (callback: () => unknown) => callback(),
      } as unknown as GlobalWorkspaceOrmManager,
      { settings, products, order, status } as unknown as SendbeeClient,
      encryption as unknown as SecretEncryptionService,
    );
  });

  it('rechecks list access before claiming or ordering', async () => {
    row.listId = 'list';
    const recipients = jest.spyOn(
      service as unknown as { listRecipients: () => Promise<unknown> },
      'listRecipients',
    );
    recipients.mockRejectedValueOnce(new Error('Access revoked'));
    await expect(
      service.send('workspace', 'actor', 'quote', 5000),
    ).rejects.toThrow('Access revoked');
    expect(save).not.toHaveBeenCalled();
    expect(order).not.toHaveBeenCalled();
  });

  it('rejects a quote when the current recipient set changed', async () => {
    row.listId = 'list';
    jest
      .spyOn(
        service as unknown as { listRecipients: () => Promise<unknown> },
        'listRecipients',
      )
      .mockResolvedValueOnce({ recipients: [] });
    await expect(
      service.send('workspace', 'actor', 'quote', 5000),
    ).rejects.toThrow('다시 검토');
    expect(order).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('persists an encrypted recipient snapshot and exposes only masked numbers', async () => {
    const result = await service.preview('workspace', 'actor', {
      mode: 'LIVE',
      productId: 'G1',
      title: '선물',
      message: '감사합니다',
      scenario: 'SUCCESS',
      testPhone: '01012345678',
    });
    expect(encryption.encryptVersioned).toHaveBeenCalledWith('01012345678', {
      workspaceId: 'workspace',
    });
    expect(persisted.recipients[0].encryptedPhone).toBe('encrypted-number');
    expect(JSON.stringify(result)).not.toMatch(/encrypted-number|01012345678/);
    expect(result.orderTrId).toMatch(/^test_[a-f0-9]{32}$/);
  });

  it('commits a claim before sending and prevents concurrent/repeated charges', async () => {
    order.mockImplementation(async () => {
      expect(persisted.status).toBe('SUBMITTING');
      return {
        orderId: 'order1',
        totalPrice: 5000,
        status: 'PROCESSING',
        coupons: [],
      };
    });
    await Promise.all([
      service.send('workspace', 'actor', 'quote', 5000),
      service.send('workspace', 'actor', 'quote', 5000),
    ]);
    await service.send('workspace', 'actor', 'quote', 5000);
    expect(order).toHaveBeenCalledTimes(1);
    expect(order.mock.calls[0][1].orderTrId).toBe('test_fixed');
  });

  it('keeps unknown orders non-retryable and preserves the reconciliation ID', async () => {
    order.mockRejectedValue(new Error('timeout'));
    const result = await service.send('workspace', 'actor', 'quote', 5000);
    expect(result).toMatchObject({
      status: 'UNKNOWN',
      orderTrId: 'test_fixed',
    });
    await service.send('workspace', 'actor', 'quote', 5000);
    expect(order).toHaveBeenCalledTimes(1);
    await expect(
      service.refresh('workspace', 'actor', 'quote'),
    ).rejects.toThrow('주문번호');
  });

  it('does not resubmit a crash-left durable claim', async () => {
    row.status = 'SUBMITTING';
    expect(
      (await service.send('workspace', 'actor', 'quote', 5000)).status,
    ).toBe('SUBMITTING');
    expect(order).not.toHaveBeenCalled();
  });

  it.each([
    'cost',
    'budget',
    'expired',
    'price',
    'account',
    'sender',
    'sold-out',
  ])('rejects changed %s before payment', async (reason) => {
    if (reason === 'budget')
      settings.mockReturnValue({ ...config, maxOrderAmount: 4999 });
    if (reason === 'expired') row.expiresAt = new Date(0);
    if (reason === 'price')
      products.mockResolvedValue([{ ...product, price: 5001 }]);
    if (reason === 'account')
      settings.mockReturnValue({ ...config, mid: 'other' });
    if (reason === 'sender')
      settings.mockReturnValue({ ...config, senderName: 'other' });
    if (reason === 'sold-out') products.mockResolvedValue([]);
    await expect(
      service.send('workspace', 'actor', 'quote', reason === 'cost' ? 0 : 5000),
    ).rejects.toThrow();
    expect(order).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects another workspace or actor without provider access', async () => {
    await expect(service.send('other', 'actor', 'quote', 5000)).rejects.toThrow(
      '권한',
    );
    await expect(
      service.refresh('workspace', 'other', 'quote'),
    ).rejects.toThrow('권한');
    expect(order).not.toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it('refreshes existing orders without issuing more coupons and masks recipients', async () => {
    row.status = 'PROCESSING';
    row.provider!.orderId = 'order1';
    const result = await service.refresh('workspace', 'actor', 'quote');
    expect(result.status).toBe('SENT');
    expect(result.recipients[0]).toEqual({
      personId: null,
      phone: '010-****-5678',
      status: 'AVAILABLE',
    });
    expect(order).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(config, 'order1', 'G1');
  });
});
