export type SendCampaignEmailJobData = {
  workspaceId: string;
  campaignId: string;
  messageId: string;
  personId: string | null;
  workspaceMemberId?: string;
  recipientEmail: string;
  emailingDomainId?: string;
  connectedAccountId?: string;
  senderUserWorkspaceId?: string;
};
