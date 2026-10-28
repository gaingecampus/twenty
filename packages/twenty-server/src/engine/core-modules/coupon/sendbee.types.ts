export type SendbeeConfig = {
  enabled?: boolean;
  workspaceId?: string;
  environment?: 'development' | 'production';
  mid?: string;
  keyBase64?: string;
  ivBase64?: string;
  timeZone?: string;
  // v0.8 has conflicting field/path examples; confirm with the provider before enabling.
  protocolConfirmed?: boolean;
  recipientField?: 'recvNums' | 'receiveNums';
  statusPath?: '/api/coupon/v1/status' | '/api/order/v1/getCouponStatus';
  senderName?: string;
  sendNumber?: string;
  maxOrderAmount?: number;
};

export type SendbeeOrder = {
  orderId: string;
  status: 'PROCESSING' | 'SENT' | 'CANCELLED' | 'UNKNOWN';
  totalPrice: number;
  coupons: { phone: string; transactionId: string; status: string }[];
};

export type CouponProviderState = {
  environment: 'development' | 'production';
  mid: string;
  orderTrId: string;
  title: string;
  senderName: string;
  sendNumber?: string;
  orderId?: string;
  submittedAt?: string;
  checkedAt?: string;
  actualCost?: number;
};
