import { type CampaignRecipient } from 'src/engine/core-modules/emailing-domain/types/campaign-recipient.type';

export type MaterializeCampaignJobData = {
  scheduleVersion?: string;
  workspaceId: string;
  campaignId: string;
  messageChannelId: string;
  emailingDomainId?: string;
  connectedAccountId?: string;
  senderUserWorkspaceId?: string;
  recipients: CampaignRecipient[];
};
