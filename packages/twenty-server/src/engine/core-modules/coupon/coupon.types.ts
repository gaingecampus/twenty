import { type EncryptedString } from '../secret-encryption/branded-strings/encrypted-string.type';
export type CouponScenario =
  | 'SUCCESS'
  | 'DELIVERY_FAILED'
  | 'UNKNOWN'
  | 'INSUFFICIENT_BALANCE';

export type CouponProduct = {
  id: string;
  name: string;
  price: number;
  validityDays: number;
};

export type CouponRecipient = {
  personId: string | null;
  phone: string;
  status: string;
  encryptedPhone?: EncryptedString;
};

// These are fixtures, never supplier product codes or negotiated prices.
export const COUPON_SIMULATION_PRODUCTS: readonly CouponProduct[] = [
  { id: 'SIM-COFFEE', name: '테스트 커피 쿠폰', price: 5000, validityDays: 30 },
  {
    id: 'SIM-STORE',
    name: '테스트 편의점 쿠폰',
    price: 10000,
    validityDays: 30,
  },
];

export const COUPON_SIMULATION_BUDGET = 100000;
export const COUPON_MAX_RECIPIENTS = 1000;
export const COUPON_QUOTE_TTL_MS = 10 * 60 * 1000;
