import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';

export const SmsCampaignComposerContent = ({
  isSendingBlocked = false,
}: {
  isSendingBlocked?: boolean;
}) => {
  const isSmsAvailable = useSmsDispatchAvailability();

  return (
    <SmsCampaignComposer
      isSendingDisabled={!isSmsAvailable}
      isSendingBlocked={isSendingBlocked}
    />
  );
};
