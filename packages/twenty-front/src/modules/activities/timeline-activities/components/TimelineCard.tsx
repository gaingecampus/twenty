import { MessageListTimeline } from '@/activities/emails/components/message-lists/MessageListTimeline';
import { TimelineCardContent } from '@/activities/timeline-activities/components/TimelineCardContent';
import { useTimelineActivities } from '@/activities/timeline-activities/hooks/useTimelineActivities';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';

const AuditTimelineCard = ({
  targetRecord,
}: {
  targetRecord: ActivityTargetableObject;
}) => {
  const activity = useTimelineActivities(targetRecord);
  return (
    <TimelineCardContent
      targetRecord={targetRecord}
      timelineActivities={activity.timelineActivities}
      firstQueryLoading={activity.firstQueryLoading}
      loadingMore={activity.loadingMore}
      fetchMoreRecords={activity.fetchMoreRecords}
    />
  );
};

export const TimelineCard = () => {
  const targetRecord = useTargetRecord();
  return targetRecord.targetObjectNameSingular === 'messageList' ? (
    <MessageListTimeline key={targetRecord.id} targetRecord={targetRecord} />
  ) : (
    <AuditTimelineCard key={targetRecord.id} targetRecord={targetRecord} />
  );
};
