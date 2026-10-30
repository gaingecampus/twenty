import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';

export const SmsCampaignComposerContent = () => {
  const isSmsAvailable = useSmsDispatchAvailability();

  return <SmsCampaignComposer isSendingDisabled={!isSmsAvailable} />;
};
