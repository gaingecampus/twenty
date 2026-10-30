import { type CampaignRecipientMode } from '@/activities/emails/types/CampaignRecipientMode';
import { type EmailAttachment } from 'twenty-shared/types';
import { useEmailSignature } from '@/settings/accounts/hooks/useEmailSignature';
import { appendEmailSignature } from '@/activities/emails/utils/appendEmailSignature';
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
  draftReference?: { id: string; version: string };
  savingDraft?: boolean;
};

export const useCampaignComposerState = ({
  onSent,
  campaign,
  draftReference,
  savingDraft = false,
}: UseCampaignComposerStateArgs) => {
  const draft = campaign?.status === 'DRAFT' ? campaign.draftData : undefined;
  const isEditing = campaign?.status === 'SCHEDULED';
  const [unsubscribeTopicId, setUnsubscribeTopicId] = useState<string | null>(
    draft?.unsubscribeTopicId ?? campaign?.unsubscribeTopicId ?? null,
  );
  const [recipientMode, setRecipientMode] = useState<CampaignRecipientMode>(
    draft?.recipientMode ?? 'list',
  );
  const [directEmail, setDirectEmail] = useState(draft?.directRecipient ?? '');
  const [listId, setListId] = useState<string | null>(
    draft?.listId ?? campaign?.listId ?? null,
  );
  const [fromAddress, setFromAddress] = useState(
    draft?.fromAddress ?? campaign?.fromAddress?.primaryEmail ?? '',
  );
  const [subject, setSubject] = useState(
    draft?.subject ?? campaign?.subject ?? '',
  );
  const [files, setFiles] = useState<EmailAttachment[]>(
    draft?.files ?? campaign?.attachmentFiles ?? [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [body, setBody] = useState(draft?.body ?? campaign?.bodyTemplate ?? '');
  const {
    signature,
    loading: signatureLoading,
    error: signatureError,
  } = useEmailSignature();
  // Scheduled campaigns already contain the signature saved at scheduling time.
  const [includeSignature, setIncludeSignature] = useState(
    draft?.includeSignature ?? !isEditing,
  );
  const bodyWithSignature = appendEmailSignature(
    body,
    signature,
    includeSignature,
  );
  const signatureReady =
    !includeSignature || (!signatureLoading && !signatureError);

  const { sendMessageCampaign, loading } = useSendMessageCampaign();

  const [sendMode, setSendMode] = useState(
    draft?.sendMode ?? (isEditing ? 'scheduled' : 'immediate'),
  );
  const [scheduledAt, setScheduledAt] = useState<string | null>(
    draft?.scheduledAt ?? campaign?.scheduledAt ?? null,
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
    recipientMode === 'list' &&
    listId !== null &&
    fromAddress.trim().length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    scheduleValid &&
    !isUploading &&
    !isTestSending &&
    signatureReady &&
    !cancelling &&
    !loading &&
    !savingDraft;

  // Synchronous submission lock; rendered loading state comes from the mutation.
  // oxlint-disable-next-line twenty/no-state-useref
  const submittingRef = useRef(false);
  const handleSend = () => {
    if (canSend && !submittingRef.current) setIsReviewOpen(true);
  };
  const closeReview = () => {
    if (!submittingRef.current) setIsReviewOpen(false);
  };
  const confirmSend = async () => {
    if (!isReviewOpen || listId === null || !canSend || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    try {
      const success = await sendMessageCampaign({
        scheduledAt:
          sendMode === 'scheduled' ? (scheduledAt ?? undefined) : undefined,
        draft: draftReference,
        campaignId: isEditing ? campaign?.id : undefined,
        scheduleVersion: isEditing
          ? (campaign?.scheduleVersion ?? undefined)
          : undefined,
        listId,
        unsubscribeTopicId: unsubscribeTopicId ?? undefined,
        subject,
        body: bodyWithSignature,
        files,
        fromAddress: fromAddress.trim(),
      });

      if (success) {
        setIsReviewOpen(false);
        onSent?.();
      }
    } finally {
      submittingRef.current = false;
    }
  };

  return {
    isReviewOpen,
    closeReview,
    confirmSend,
    signature,
    signatureLoading,
    signatureError,
    signatureReady,
    includeSignature,
    setIncludeSignature,
    bodyWithSignature,
    files,
    setFiles,
    setIsUploading,
    isUploading,
    isTestSending,
    setIsTestSending,
    isEditing,
    sendMode,
    setSendMode,
    scheduledAt,
    setScheduledAt,
    scheduleValid,
    cancelSchedule,
    cancelling,
    unsubscribeTopicId,
    setUnsubscribeTopicId,
    recipientMode,
    setRecipientMode,
    directEmail,
    setDirectEmail,
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
