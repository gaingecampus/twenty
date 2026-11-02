import {
  buildMessageListMilestones,
  type MessageListCampaignMilestoneSource,
} from '@/activities/emails/utils/buildMessageListMilestones';
import { TimelineCardContent } from '@/activities/timeline-activities/components/TimelineCardContent';
import { useTimelineActivities } from '@/activities/timeline-activities/hooks/useTimelineActivities';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const MessageListTimeline = ({
  targetRecord,
}: {
  targetRecord: ActivityTargetableObject;
}) => {
  const audit = useTimelineActivities(targetRecord);
  const {
    record: list,
    loading: loadingList,
    error: listError,
  } = useFindOneRecord<ObjectRecord & { createdAt: string }>({
    objectNameSingular: 'messageList',
    objectRecordId: targetRecord.id,
    recordGqlFields: { id: true, createdAt: true },
  });
  const {
    records: campaigns,
    loading,
    error,
    fetchMoreRecords,
    objectMetadataItem,
  } = useFindManyRecords<ObjectRecord & MessageListCampaignMilestoneSource>({
    objectNameSingular: 'messageCampaign',
    filter: { listId: { eq: targetRecord.id } },
    orderBy: [{ createdAt: 'DescNullsLast' }],
    recordGqlFields: { id: true, subject: true, createdAt: true, sentAt: true },
    fetchPolicy: 'cache-and-network',
  });
  return (
    <>
      {(listError || error) && (
        <p role="alert">기존 생성·발송 기록을 불러오지 못했습니다.</p>
      )}
      <TimelineCardContent
        targetRecord={targetRecord}
        timelineActivities={buildMessageListMilestones({
          list,
          campaigns,
          campaignMetadataId: objectMetadataItem.id,
          activities: audit.timelineActivities,
        })}
        firstQueryLoading={
          audit.firstQueryLoading ||
          loadingList ||
          (loading && campaigns.length === 0)
        }
        loadingMore={audit.loadingMore || loading}
        fetchMoreRecords={async () => {
          await Promise.all([audit.fetchMoreRecords(), fetchMoreRecords()]);
        }}
      />
    </>
  );
};
