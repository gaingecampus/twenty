import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';

export type MessageListCampaignMilestoneSource = {
  id: string;
  subject: string | null;
  createdAt: string;
  sentAt: string | null;
};

// These are dated facts from stored records, not reconstructed audit events.
export const buildMessageListMilestones = ({
  list,
  campaigns,
  campaignMetadataId,
  activities,
}: {
  list?: { id: string; createdAt: string };
  campaigns: MessageListCampaignMilestoneSource[];
  campaignMetadataId: string;
  activities: TimelineActivity[];
}): TimelineActivity[] => {
  const milestones: TimelineActivity[] = [];
  const add = (
    id: string,
    date: string | null | undefined,
    kind: string,
    campaign?: MessageListCampaignMilestoneSource,
  ) => {
    if (!date || !Number.isFinite(Date.parse(date))) return;
    milestones.push({
      id: `message-list-milestone:${id}:${kind}`,
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
      workspaceMemberId: null,
      workspaceMember: null,
      name: campaign ? 'linked-messageCampaign.created' : 'messageList.created',
      properties: { messagingMilestone: kind },
      linkedRecordCachedName: campaign?.subject ?? '',
      linkedRecordId: campaign?.id ?? null,
      linkedObjectMetadataId: campaign ? campaignMetadataId : null,
      __typename: 'TimelineActivity',
    });
  };
  if (
    list &&
    !activities.some((event) => event.name === 'messageList.created')
  ) {
    add(list.id, list.createdAt, 'list-created');
  }
  for (const campaign of campaigns) {
    add(campaign.id, campaign.createdAt, 'campaign-created', campaign);
    add(campaign.id, campaign.sentAt, 'campaign-sent', campaign);
  }
  return [...activities, ...milestones].toSorted(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
};
