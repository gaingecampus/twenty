import { createCipheriv, createDecipheriv } from 'node:crypto';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type CouponProduct } from './coupon.types';
import { type SendbeeConfig, type SendbeeOrder } from './sendbee.types';

type Json = Record<string, unknown>;
const object = (value: unknown): Json => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid response');
  return value as Json;
};
const text = (value: unknown): string => {
  if (typeof value !== 'string' || !value) throw new Error('Invalid response');
  return value;
};
const amount = (value: unknown): number => {
  if (typeof value !== 'number' && typeof value !== 'string')
    throw new Error('Invalid amount');
  if (value === '') throw new Error('Invalid amount');
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0)
    throw new Error('Invalid amount');
  return result;
};

export const sendbeeAuthorization = (
  config: SendbeeConfig,
  now = new Date(),
) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const timestamp = ['year', 'month', 'day', 'hour', 'minute', 'second']
    .map((name) => parts.find((part) => part.type === name)?.value)
    .join('');
  const key = Buffer.from(config.keyBase64 ?? '', 'base64');
  const cipher = createCipheriv(
    `aes-${key.length * 8}-cbc`,
    key,
    Buffer.from(config.ivBase64 ?? '', 'base64'),
  );
  return Buffer.concat([
    cipher.update(`${config.mid}|${timestamp}`, 'utf8'),
    cipher.final(),
  ]).toString('base64');
};

@Injectable()
export class SendbeeClient {
  constructor(private readonly config: TwentyConfigService) {}

  settings(workspaceId: string): SendbeeConfig {
    const value = this.config.get('SENDBEE_CONFIG');
    const invalid = () =>
      new ServiceUnavailableException(
        '센드비 관리자 설정 및 계정별 연동 규격 확인이 필요합니다.',
      );
    if (
      !value ||
      value.enabled !== true ||
      value.protocolConfirmed !== true ||
      value.workspaceId !== workspaceId ||
      !['development', 'production'].includes(value.environment ?? '') ||
      !value.mid ||
      !/^[a-zA-Z0-9_-]+$/.test(value.mid) ||
      !value.senderName?.trim() ||
      !['recvNums', 'receiveNums'].includes(value.recipientField ?? '') ||
      !['/api/coupon/v1/status', '/api/order/v1/getCouponStatus'].includes(
        value.statusPath ?? '',
      ) ||
      !Number.isSafeInteger(value.maxOrderAmount) ||
      (value.maxOrderAmount ?? 0) <= 0 ||
      !value.timeZone ||
      ![16, 24, 32].includes(
        Buffer.from(value.keyBase64 ?? '', 'base64').length,
      ) ||
      Buffer.from(value.ivBase64 ?? '', 'base64').length !== 16
    )
      throw invalid();
    try {
      sendbeeAuthorization(value);
    } catch {
      throw invalid();
    }
    return { ...value };
  }

  available(workspaceId: string) {
    try {
      this.settings(workspaceId);
      return true;
    } catch {
      return false;
    }
  }

  private async post(
    config: SendbeeConfig,
    path: string,
    body: Json,
  ): Promise<Json> {
    const base =
      config.environment === 'production'
        ? 'https://api.sendbee.co.kr'
        : 'https://dev2.giftting.co.kr:36710';
    // No retry: an HTTP error or timeout after order submission can still have charged the account.
    try {
      const response = await fetch(`${base}${path}`, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
        headers: {
          Authorization: sendbeeAuthorization(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, mid: config.mid }),
      });
      if (!response.ok) throw new Error('HTTP failure');
      const result = object(await response.json());
      const status = object(result.result);
      const codes = [status.resultCode, status.returnCode].filter(
        (code) => code !== undefined,
      );
      if (!codes.length || codes.some((code) => code !== 'S0000'))
        throw new Error('Provider failure');
      return result;
    } catch {
      // Provider messages can contain credentials or phone numbers. Never return or log the raw response.
      throw new ServiceUnavailableException(
        '센드비 요청 결과를 확인하지 못했습니다. 발송 요청은 자동 재시도하지 않습니다.',
      );
    }
  }

  async products(config: SendbeeConfig): Promise<CouponProduct[]> {
    const response = await this.post(config, '/api/product/v1/productList', {});
    if (!Array.isArray(response.productList))
      throw new ServiceUnavailableException(
        '센드비 상품 목록을 확인할 수 없습니다.',
      );
    return response.productList.flatMap((item) => {
      try {
        const product = object(item);
        if (product.displayYN !== 'Y') return [];
        // Dates in the supplied format have no zone. Require a valid, future local vendor date.
        const limit = text(product.limitDate);
        const today = new Intl.DateTimeFormat('sv-SE', {
          timeZone: config.timeZone,
        }).format(new Date());
        if (
          !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(limit) ||
          limit.slice(0, 10) <= today
        )
          return [];
        return [
          {
            id: text(product.goodsId),
            name: text(product.goodsName),
            price: amount(product.salePrice),
            validityDays: amount(product.expiry),
          },
        ];
      } catch {
        return [];
      }
    });
  }

  async order(
    config: SendbeeConfig,
    input: {
      productId: string;
      phones: string[];
      title: string;
      message: string;
      orderTrId: string;
    },
  ): Promise<SendbeeOrder> {
    const response = await this.post(config, '/api/order/v1/order', {
      goodsId: input.productId,
      sendType: 'KAKAO',
      senderName: config.senderName,
      ...(config.sendNumber ? { sendNumber: config.sendNumber } : {}),
      msgTitle: encodeURIComponent(input.title),
      msgContent: encodeURIComponent(input.message),
      count: input.phones.length,
      [config.recipientField!]: input.phones.join(','),
      orderTrID: input.orderTrId,
    });
    return this.parseOrder(config, response.data, input.productId);
  }

  async status(
    config: SendbeeConfig,
    orderId: string,
    productId: string,
  ): Promise<SendbeeOrder> {
    const response = await this.post(config, config.statusPath!, { orderId });
    const result = this.parseOrder(config, response.data, productId);
    if (result.orderId !== orderId)
      throw new ServiceUnavailableException(
        '센드비 주문번호가 일치하지 않습니다.',
      );
    return result;
  }

  private parseOrder(
    config: SendbeeConfig,
    raw: unknown,
    productId: string,
  ): SendbeeOrder {
    try {
      const data = object(raw);
      if (
        data.mid !== config.mid ||
        data.goodsId !== productId ||
        data.sendType !== 'KAKAO'
      )
        throw new Error('Mismatched order');
      return {
        orderId: text(data.orderId),
        totalPrice: amount(data.totalPrice),
        status:
          data.orderStatus === '1'
            ? 'PROCESSING'
            : data.orderStatus === '2'
              ? 'SENT'
              : data.orderStatus === '3'
                ? 'CANCELLED'
                : 'UNKNOWN',
        coupons: Array.isArray(data.couponList)
          ? data.couponList.map((rawCoupon) => {
              const coupon = object(rawCoupon);
              // Only correlate recipients. Bearer coupon numbers are never returned or persisted.
              let phone = '';
              try {
                const key = Buffer.from(config.keyBase64!, 'base64');
                const decipher = createDecipheriv(
                  `aes-${key.length * 8}-cbc`,
                  key,
                  Buffer.from(config.ivBase64!, 'base64'),
                );
                phone = Buffer.concat([
                  decipher.update(text(coupon.receiveNum), 'base64'),
                  decipher.final(),
                ]).toString('utf8');
              } catch {
                /* Unconfirmed field encryption: keep recipient status unknown. */
              }
              return {
                phone,
                transactionId: text(coupon.transactionId),
                status:
                  coupon.cpnStatus === 'B'
                    ? 'AVAILABLE'
                    : coupon.cpnStatus === 'X'
                      ? 'UNAVAILABLE'
                      : coupon.cpnStatus === '0'
                        ? 'PROCESSING'
                        : 'UNKNOWN',
              };
            })
          : [],
      };
    } catch {
      throw new ServiceUnavailableException(
        '센드비 주문 응답을 해석하지 못했습니다. 주문을 다시 요청하지 말고 결과를 확인하세요.',
      );
    }
  }
}
