import { useRef, useState } from 'react';
import {
  type CancelScheduledMessageCampaignMutation,
  type CancelScheduledMessageCampaignMutationVariables,
} from '~/generated-metadata/graphql';
import { useMutation } from '@apollo/client/react';
import { type ScheduledCampaign } from '@/activities/emails/types/ScheduledCampaign';
import { CANCEL_SCHEDULED_MESSAGE_CAMPAIGN } from '@/activities/emails/graphql/mutations/cancelScheduledMessageCampaign';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';

import { useSendMessageCampaign } from '@/activities/emails/hooks/useSendMessageCampaign';

type UseCampaignComposerStateArgs = {
  onSent?: () => void;
  campaign?: ScheduledCampaign | null;
};

export const useCampaignComposerState = ({
  onSent,
  campaign,
}: UseCampaignComposerStateArgs) => {
  const [unsubscribeTopicId, setUnsubscribeTopicId] = useState<string | null>(
    campaign?.unsubscribeTopicId ?? null,
  );
  const [listId, setListId] = useState<string | null>(campaign?.listId ?? null);
  const [fromAddress, setFromAddress] = useState(
    campaign?.fromAddress?.primaryEmail ?? '',
  );
  const [subject, setSubject] = useState(campaign?.subject ?? '');
  const [body, setBody] = useState(campaign?.bodyTemplate ?? '');

  const { sendMessageCampaign, loading } = useSendMessageCampaign();

  const [sendMode, setSendMode] = useState(
    campaign ? 'scheduled' : 'immediate',
  );
  const [scheduledAt, setScheduledAt] = useState<string | null>(
    campaign?.scheduledAt ?? null,
  );
  const [cancelMutation, { loading: cancelling }] = useMutation<
    CancelScheduledMessageCampaignMutation,
    CancelScheduledMessageCampaignMutationVariables
  >(CANCEL_SCHEDULED_MESSAGE_CAMPAIGN);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const scheduleValid =
    sendMode === 'immediate' ||
    (scheduledAt !== null &&
      new Date(scheduledAt).getTime() >= Date.now() + 60_000);
  const cancelSchedule = async () => {
    if (!campaign?.scheduleVersion || cancelling) return;
    try {
      await cancelMutation({
        variables: {
          campaignId: campaign.id,
          scheduleVersion: campaign.scheduleVersion,
        },
      });
      enqueueSuccessSnackBar({ message: t`Campaign schedule cancelled` });
      onSent?.();
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : t`Failed to cancel campaign schedule`,
      });
    }
  };

  const canSend =
    listId !== null &&
    fromAddress.trim().length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    scheduleValid &&
    !cancelling &&
    !loading;

  // Synchronous submission lock; rendered loading state comes from the mutation.
  // oxlint-disable-next-line twenty/no-state-useref
  const submittingRef = useRef(false);
  const handleSend = async () => {
    if (listId === null || !canSend || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    try {
      const success = await sendMessageCampaign({
        scheduledAt:
          sendMode === 'scheduled' ? (scheduledAt ?? undefined) : undefined,
        campaignId: campaign?.id,
        scheduleVersion: campaign?.scheduleVersion ?? undefined,
        listId,
        unsubscribeTopicId: unsubscribeTopicId ?? undefined,
        subject,
        body,
        fromAddress: fromAddress.trim(),
      });

      if (success) {
        onSent?.();
      }
    } finally {
      submittingRef.current = false;
    }
  };

  return {
    isEditing: !!campaign,
    sendMode,
    setSendMode,
    scheduledAt,
    setScheduledAt,
    scheduleValid,
    cancelSchedule,
    cancelling,
    unsubscribeTopicId,
    setUnsubscribeTopicId,
    listId,
    setListId,
    fromAddress,
    setFromAddress,
    subject,
    setSubject,
    body,
    setBody,
    handleSend,
    canSend,
    loading,
  };
};
