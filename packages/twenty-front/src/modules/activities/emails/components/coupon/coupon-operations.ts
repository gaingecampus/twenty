import { gql } from '@apollo/client';

export type CouponProduct = {
  id: string;
  name: string;
  price: number;
  validityDays: number;
};
export type CouponDispatch = {
  orderId?: string;
  orderTrId?: string;
  environment?: string;
  title?: string;
  actualCost?: number;
  id: string;
  mode: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  scenario: string;
  message: string;
  product: CouponProduct;
  total: number;
  missing: number;
  duplicates: number;
  recipientCount: number;
  estimatedCost: number;
  recipients: { personId: string | null; phone: string; status: string }[];
};
export type CouponCapabilities = {
  mode: string;
  liveAvailable: boolean;
  liveBlockedReason: string;
  simulationBudget: number;
  liveBudget: number;
  environment?: string;
  liveProducts: CouponProduct[];
  products: CouponProduct[];
};

export const COUPON_CAPABILITIES = gql`
  query CouponCapabilities {
    couponCapabilities {
      mode
      liveAvailable
      liveBlockedReason
      simulationBudget
      liveBudget
      environment
      liveProducts {
        id
        name
        price
        validityDays
      }
      products {
        id
        name
        price
        validityDays
      }
    }
  }
`;
const COUPON_SUMMARY = gql`
  fragment CouponDispatchFields on CouponDispatchSummary {
    id
    orderId
    orderTrId
    environment
    title
    actualCost
    mode
    status
    createdAt
    expiresAt
    scenario
    message
    total
    missing
    duplicates
    recipientCount
    estimatedCost
    product {
      id
      name
      price
      validityDays
    }
    recipients {
      personId
      phone
      status
    }
  }
`;
export const PREVIEW_COUPON = gql`
  mutation PreviewCouponDispatch($input: CouponPreviewInput!) {
    previewCouponDispatch(input: $input) {
      ...CouponDispatchFields
    }
  }
  ${COUPON_SUMMARY}
`;
export const SIMULATE_COUPON = gql`
  mutation SimulateCouponDispatch($input: CouponSimulationInput!) {
    simulateCouponDispatch(input: $input) {
      ...CouponDispatchFields
    }
  }
  ${COUPON_SUMMARY}
`;
export const COUPON_HISTORY = gql`
  query CouponDispatchHistory {
    couponDispatchHistory {
      ...CouponDispatchFields
    }
  }
  ${COUPON_SUMMARY}
`;

export const SEND_COUPON = gql`
  mutation SendCouponDispatch($input: CouponSendInput!) {
    sendCouponDispatch(input: $input) {
      ...CouponDispatchFields
    }
  }
  ${COUPON_SUMMARY}
`;
export const REFRESH_COUPON = gql`
  mutation RefreshCouponDispatch($input: CouponSimulationInput!) {
    refreshCouponDispatch(input: $input) {
      ...CouponDispatchFields
    }
  }
  ${COUPON_SUMMARY}
`;
