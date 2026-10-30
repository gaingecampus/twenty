import { type CampaignDraftControls } from '@/activities/emails/types/CampaignDraftControls';
import { type ReactNode } from 'react';
import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';

export const SmsCampaignComposerContent = ({
  isSendingBlocked = false,
  renderDispatchOptions,
  initialDraft,
  draftReference,
  saveDraft,
  savingDraft,
}: CampaignDraftControls & {
  isSendingBlocked?: boolean;
  renderDispatchOptions?: (recipientFields: ReactNode) => ReactNode;
}) => {
  const isSmsAvailable = useSmsDispatchAvailability();

  return (
    <SmsCampaignComposer
      initialDraft={initialDraft}
      draftReference={draftReference}
      saveDraft={saveDraft}
      savingDraft={savingDraft}
      isSendingDisabled={!isSmsAvailable}
      isSendingBlocked={isSendingBlocked}
      renderDispatchOptions={renderDispatchOptions}
    />
  );
};
