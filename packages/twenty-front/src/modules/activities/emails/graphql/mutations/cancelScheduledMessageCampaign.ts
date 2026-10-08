import gql from 'graphql-tag';

export const CANCEL_SCHEDULED_MESSAGE_CAMPAIGN = gql`
  mutation CancelScheduledMessageCampaign(
    $campaignId: String!
    $scheduleVersion: String!
  ) {
    cancelScheduledMessageCampaign(
      campaignId: $campaignId
      scheduleVersion: $scheduleVersion
    )
  }
`;
