import { type EmailAttachment } from './EmailAttachment';

export type CampaignDraft = {
  channel: 'email' | 'sms' | 'coupon';
  sendMode: 'immediate' | 'scheduled';
  scheduledAt: string | null;
  unsubscribeTopicId: string | null;
  recipientMode: 'list' | 'direct';
  listId: string | null;
  directRecipient: string;
  subject: string;
  body: string;
  fromAddress: string;
  files: EmailAttachment[];
  includeSignature: boolean;
  advertising: boolean;
  couponMode: 'SIMULATION' | 'LIVE';
  productId: string;
  scenario: 'SUCCESS' | 'DELIVERY_FAILED' | 'INSUFFICIENT_BALANCE' | 'UNKNOWN';
};
