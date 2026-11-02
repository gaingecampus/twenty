import { type SmsCampaignDeliveryPage } from '~/generated-metadata/graphql';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const SMS_CAMPAIGN_DELIVERIES = gql`
  query SmsCampaignDeliveries($input: SmsCampaignDeliveriesInput!) {
    smsCampaignDeliveries(input: $input) {
      totalCount
      records {
        id
        personId
        name
        phone
        messageType
        status
        createdAt
        error
      }
    }
  }
`;

export const useSmsCampaignDeliveryPage = ({
  campaignId,
  page,
  skip,
}: {
  campaignId: string;
  page: number;
  skip: boolean;
}) => {
  const { data, loading, error, refetch } = useQuery<{
    smsCampaignDeliveries: SmsCampaignDeliveryPage;
  }>(SMS_CAMPAIGN_DELIVERIES, {
    variables: { input: { campaignId, offset: page * 20, limit: 20 } },
    skip,
    fetchPolicy: 'no-cache',
    notifyOnNetworkStatusChange: true,
  });
  return {
    records:
      !skip && !loading && !error
        ? (data?.smsCampaignDeliveries.records ?? [])
        : [],
    totalCount:
      !skip && !loading && !error
        ? (data?.smsCampaignDeliveries.totalCount ?? 0)
        : 0,
    loading,
    error,
    refetch,
  };
};
