import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type ScheduledCampaign = ObjectRecord & {
  subject: string | null;
  bodyTemplate: string | null;
  fromAddress: { primaryEmail: string } | null;
  listId: string | null;
  unsubscribeTopicId: string | null;
  scheduledAt: string | null;
  scheduleVersion: string | null;
  status: string;
};
