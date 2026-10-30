import { type ReactNode } from 'react';
import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';

export const SmsCampaignComposerContent = ({
  isSendingBlocked = false,
  renderDispatchOptions,
}: {
  isSendingBlocked?: boolean;
  renderDispatchOptions?: (recipientFields: ReactNode) => ReactNode;
}) => {
  const isSmsAvailable = useSmsDispatchAvailability();

  return (
    <SmsCampaignComposer
      isSendingDisabled={!isSmsAvailable}
      isSendingBlocked={isSendingBlocked}
      renderDispatchOptions={renderDispatchOptions}
    />
  );
};
