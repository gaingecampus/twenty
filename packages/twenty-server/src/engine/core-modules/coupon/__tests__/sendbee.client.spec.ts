import { createCipheriv, createDecipheriv } from 'node:crypto';
import { type TwentyConfigService } from '../../twenty-config/twenty-config.service';
import { SendbeeClient, sendbeeAuthorization } from '../sendbee.client';
import { type SendbeeConfig } from '../sendbee.types';

const config: SendbeeConfig = {
  enabled: true,
  protocolConfirmed: true,
  workspaceId: 'workspace',
  environment: 'development',
  mid: 'test',
  keyBase64: Buffer.alloc(16, 1).toString('base64'),
  ivBase64: Buffer.alloc(16, 2).toString('base64'),
  timeZone: 'Asia/Seoul',
  recipientField: 'recvNums',
  statusPath: '/api/coupon/v1/status',
  senderName: '가인지 CRM',
  maxOrderAmount: 100000,
};
const encrypted = (value: string) => {
  const cipher = createCipheriv(
    'aes-128-cbc',
    Buffer.from(config.keyBase64!, 'base64'),
    Buffer.from(config.ivBase64!, 'base64'),
  );
  return Buffer.concat([cipher.update(value), cipher.final()]).toString(
    'base64',
  );
};
const orderData = {
  mid: 'test',
  goodsId: 'G1',
  orderId: 'order1',
  orderStatus: '1',
  sendType: 'KAKAO',
  totalPrice: '5000',
  couponList: [
    {
      transactionId: 't1',
      cpnStatus: '0',
      receiveNum: encrypted('01012345678'),
      cpnNum: 'BEARER_SECRET',
    },
  ],
};

describe('Sendbee official API adapter', () => {
  let client: SendbeeClient;
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    jest.useRealTimers();
    client = new SendbeeClient({
      get: () => config,
    } as unknown as TwentyConfigService);
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());
  const respond = (value: object) =>
    ({ ok: true, json: async () => value }) as Response;

  it('encodes mid and vendor-local timestamp with AES CBC PKCS padding and base64', () => {
    const auth = sendbeeAuthorization(config, new Date('2026-10-28T01:02:03Z'));
    const decipher = createDecipheriv(
      'aes-128-cbc',
      Buffer.from(config.keyBase64!, 'base64'),
      Buffer.from(config.ivBase64!, 'base64'),
    );
    expect(
      Buffer.concat([
        decipher.update(auth, 'base64'),
        decipher.final(),
      ]).toString(),
    ).toBe('test|20261028100203');
  });

  it.each([
    { enabled: false },
    { protocolConfirmed: false },
    { workspaceId: 'other' },
    { keyBase64: '' },
    { ivBase64: '' },
    { timeZone: 'invalid' },
    { maxOrderAmount: -1 },
    { recipientField: 'bad' },
    { environment: 'http://evil' },
  ])('fails closed for invalid or unconfirmed settings %j', (override) => {
    const disabled = new SendbeeClient({
      get: () => ({ ...config, ...override }),
    } as unknown as TwentyConfigService);
    expect(disabled.available('workspace')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('filters unavailable, stale and malformed products and supports documented alternate result names', async () => {
    const product = {
      goodsId: 'G1',
      goodsName: '커피',
      salePrice: 5000,
      expiry: 30,
      displayYN: 'Y',
      limitDate: '2099-12-31 23:59:59',
    };
    fetchMock.mockResolvedValue(
      respond({
        result: { returnCode: 'S0000' },
        productList: [
          product,
          { ...product, displayYN: 'N' },
          { ...product, salePrice: -1 },
          { ...product, limitDate: '2000-01-01 00:00:00' },
        ],
      }),
    );
    expect(await client.products(config)).toEqual([
      { id: 'G1', name: '커피', price: 5000, validityDays: 30 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://dev2.giftting.co.kr:36710/api/product/v1/productList',
    );
  });

  it('submits the exact confirmed protocol, stable transaction ID and URL-encoded content', async () => {
    fetchMock.mockResolvedValue(
      respond({ result: { resultCode: 'S0000' }, data: orderData }),
    );
    const result = await client.order(config, {
      productId: 'G1',
      phones: ['01012345678'],
      title: '감사합니다',
      message: '쿠폰 선물',
      orderTrId: 'test_fixed',
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      mid: 'test',
      goodsId: 'G1',
      sendType: 'KAKAO',
      count: 1,
      recvNums: '01012345678',
      orderTrID: 'test_fixed',
      msgTitle: encodeURIComponent('감사합니다'),
      msgContent: encodeURIComponent('쿠폰 선물'),
    });
    expect(result).toMatchObject({
      orderId: 'order1',
      status: 'PROCESSING',
      totalPrice: 5000,
      coupons: [{ phone: '01012345678', status: 'PROCESSING' }],
    });
    expect(JSON.stringify(result)).not.toContain('BEARER_SECRET');
  });

  it('does not retry or expose provider errors after an ambiguous failure', async () => {
    fetchMock.mockRejectedValue(new Error('key=SECRET phone=01012345678'));
    await expect(
      client.order(config, {
        productId: 'G1',
        phones: ['01012345678'],
        title: 'title',
        message: 'message',
        orderTrId: 'test_fixed',
      }),
    ).rejects.toThrow('자동 재시도하지 않습니다');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects conflicting success codes and mismatched status responses', async () => {
    fetchMock.mockResolvedValueOnce(
      respond({
        result: { resultCode: 'S0000', returnCode: 'E0000' },
        data: orderData,
      }),
    );
    await expect(client.status(config, 'order1', 'G1')).rejects.toThrow();
    fetchMock.mockResolvedValueOnce(
      respond({
        result: { resultCode: 'S0000' },
        data: { ...orderData, orderId: 'wrong' },
      }),
    );
    await expect(client.status(config, 'order1', 'G1')).rejects.toThrow(
      '주문번호',
    );
    expect(fetchMock.mock.calls[1][0]).toContain('/api/coupon/v1/status');
  });
});
