import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ScheduledCampaign } from '@/activities/emails/types/ScheduledCampaign';
import { useOpenCampaignComposerInSidePanel } from '@/side-panel/hooks/useOpenCampaignComposerInSidePanel';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';

export const EditScheduledCampaignCommand = () => {
  const { selectedRecords } = useHeadlessCommandContextApi();
  const { record, loading } = useFindOneRecord<ScheduledCampaign>({
    objectNameSingular: 'messageCampaign',
    objectRecordId: selectedRecords[0]?.id,
    recordGqlFields: {
      id: true,
      subject: true,
      bodyTemplate: true,
      fromAddress: { primaryEmail: true },
      listId: true,
      unsubscribeTopicId: true,
      scheduledAt: true,
      scheduleVersion: true,
      status: true,
    },
  });
  const { openCampaignComposerInSidePanel } =
    useOpenCampaignComposerInSidePanel();
  const { enqueueErrorSnackBar } = useSnackBar();
  const execute = () => {
    if (!record || record.status !== 'SCHEDULED') {
      enqueueErrorSnackBar({
        message: t`This campaign is no longer scheduled. Refresh the list.`,
      });
      return;
    }
    openCampaignComposerInSidePanel(record);
  };
  return (
    <HeadlessEngineCommandWrapperEffect execute={execute} ready={!loading} />
  );
};
