import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useRef, useState } from 'react';
import { v4 } from 'uuid';
import { type CampaignDraft } from 'twenty-shared/types';
import { type ScheduledCampaign } from '@/activities/emails/types/ScheduledCampaign';
import { type CampaignDraftReference } from '@/activities/emails/types/CampaignDraftControls';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

const SAVE_DRAFT = gql`
  mutation SaveMessageCampaignDraft($input: SaveMessageCampaignDraftInput!) {
    saveMessageCampaignDraft(input: $input) {
      id
      version
    }
  }
`;

export const useCampaignDraft = (campaign?: ScheduledCampaign | null) => {
  const [id] = useState(() => campaign?.id ?? v4());
  const [version, setVersion] = useState(
    campaign?.status === 'DRAFT' ? campaign.scheduleVersion : null,
  );
  const [saving, setSaving] = useState(false);
  // Keep the exact request for retry after a lost response.
  // oxlint-disable-next-line twenty/no-state-useref
  const pending = useRef<{
    id: string;
    previousVersion?: string;
    version: string;
    content: CampaignDraft;
  } | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const locked = useRef(false);
  const [save] = useMutation<{
    saveMessageCampaignDraft: CampaignDraftReference;
  }>(SAVE_DRAFT);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const apolloCoreClient = useApolloCoreClient();
  const { upsertRecordsInStore } = useUpsertRecordsInStore();
  const saveDraft = async (content: CampaignDraft) => {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    try {
      // First resolve an ambiguous previous save before saving newer edits.
      if (
        pending.current &&
        JSON.stringify(pending.current.content) !== JSON.stringify(content)
      ) {
        const previous = await save({ variables: { input: pending.current } });
        const saved = previous.data?.saveMessageCampaignDraft;
        if (!saved) throw new Error('임시 저장 결과를 확인할 수 없습니다.');
        setVersion(saved.version);
        pending.current = {
          id,
          previousVersion: saved.version,
          version: v4(),
          content,
        };
      }
      pending.current ??= {
        id,
        previousVersion: version ?? undefined,
        version: v4(),
        content,
      };
      const response = await save({ variables: { input: pending.current } });
      const saved = response.data?.saveMessageCampaignDraft;
      if (!saved) throw new Error('임시 저장 결과를 확인할 수 없습니다.');
      setVersion(saved.version);
      pending.current = null;
      upsertRecordsInStore({
        partialRecords: [
          {
            id: saved.id,
            __typename: 'MessageCampaign',
            status: 'DRAFT',
            subject: content.subject || '제목 없는 초안',
            bodyTemplate: content.body,
            attachmentFiles: content.files,
            draftData: content,
            scheduleVersion: saved.version,
            listId: content.recipientMode === 'list' ? content.listId : null,
          },
        ],
      });
      // Resume commands may be unmounted, leaving their last query in Apollo.
      const cacheId = apolloCoreClient.cache.identify({
        __typename: 'MessageCampaign',
        id: saved.id,
      });
      if (cacheId) apolloCoreClient.cache.evict({ id: cacheId });
      enqueueSuccessSnackBar({
        message: '임시 저장했습니다. 발송 목록에서 이어서 작성할 수 있습니다.',
      });
      void apolloCoreClient
        .refetchQueries({
          include: 'active',
          onQueryUpdated: (query) =>
            ['FindManyMessageCampaigns', 'FindOneMessageCampaign'].includes(
              query.queryName ?? '',
            )
              ? query.refetch()
              : false,
        })
        .catch(() =>
          enqueueErrorSnackBar({
            message: '초안은 저장했습니다. 목록을 새로 고침해 주세요.',
          }),
        );
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : '임시 저장하지 못했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setSaving(false);
      locked.current = false;
    }
  };
  return {
    saveDraft,
    saving,
    draftReference: version ? { id, version } : undefined,
  };
};
