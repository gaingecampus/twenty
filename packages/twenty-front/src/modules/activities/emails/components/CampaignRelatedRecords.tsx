import { CampaignDeliveryResults } from '@/activities/emails/components/CampaignDeliveryResults';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { RecordChip } from '@/object-record/components/RecordChip';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow: auto;
  padding: ${themeCssVariables.spacing[3]};
`;
type Campaign = ObjectRecord & {
  list: (ObjectRecord & { name: string }) | null;
};
export const CampaignRecipientList = ({
  campaignId,
}: {
  campaignId: string;
}) => {
  const { record, loading, error } = useFindOneRecord<Campaign>({
    objectNameSingular: 'messageCampaign',
    objectRecordId: campaignId,
    recordGqlFields: { id: true, list: { id: true, name: true } },
  });
  return (
    <StyledSection aria-label="연결된 고객 분류">
      {loading ? (
        '불러오는 중…'
      ) : error ? (
        <p role="alert">고객 분류를 불러오지 못했습니다.</p>
      ) : record?.list ? (
        <RecordChip objectNameSingular="messageList" record={record.list} />
      ) : (
        '연결된 고객 분류가 없습니다.'
      )}
    </StyledSection>
  );
};

export const CampaignRelatedRecords = ({
  campaignId,
}: {
  campaignId: string;
  kind: 'recipients' | 'messages';
}) => <CampaignDeliveryResults key={campaignId} campaignId={campaignId} />;
