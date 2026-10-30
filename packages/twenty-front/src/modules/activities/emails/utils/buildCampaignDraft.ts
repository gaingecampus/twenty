import { type CampaignDraft } from 'twenty-shared/types';

export const buildCampaignDraft = (
  fields: Partial<CampaignDraft>,
): CampaignDraft => ({
  channel: 'email',
  sendMode: 'immediate',
  scheduledAt: null,
  unsubscribeTopicId: null,
  recipientMode: 'list',
  listId: null,
  directRecipient: '',
  subject: '',
  body: '',
  fromAddress: '',
  files: [],
  includeSignature: true,
  advertising: false,
  couponMode: 'SIMULATION',
  productId: '',
  scenario: 'SUCCESS',
  ...fields,
});
