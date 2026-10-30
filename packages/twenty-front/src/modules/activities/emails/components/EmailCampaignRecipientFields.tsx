import { CampaignRecipientHeader } from '@/activities/emails/components/CampaignRecipientHeader';
import { CampaignRecipientSelector } from '@/activities/emails/components/CampaignRecipientSelector';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useCampaignAudiencePreview } from '@/activities/emails/hooks/useCampaignAudiencePreview';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { CampaignFieldLabel } from '@/activities/emails/components/CampaignFieldLabel';
import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconUsers } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFieldGroup = styled.section`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledAudience = styled.div`
  align-items: center;
  display: flex;
  min-width: 0;
`;

type CampaignAudiencePreview = NonNullable<
  ReturnType<typeof useCampaignAudiencePreview>
>;

const buildAudienceHint = (preview: CampaignAudiencePreview): string => {
  const parts: string[] = [];

  if (preview.withoutEmail > 0) {
    parts.push(t`${preview.withoutEmail} without email`);
  }
  if (preview.duplicateEmails > 0) {
    parts.push(t`${preview.duplicateEmails} duplicate`);
  }
  if (preview.globallyUnsubscribed > 0) {
    parts.push(t`${preview.globallyUnsubscribed} unsubscribed from everything`);
  }
  if (preview.topicUnsubscribed > 0) {
    parts.push(t`${preview.topicUnsubscribed} opted out of this topic`);
  }

  const breakdown = parts.length > 0 ? ` (${parts.join(', ')})` : '';

  return (
    t`${preview.totalMembers} in this list — ${preview.sendable} sendable` +
    breakdown
  );
};

export const EmailCampaignRecipientFields = ({
  campaignState,
}: {
  campaignState: ReturnType<typeof useCampaignComposerState>;
}) => {
  const { createOneRecord: createMessageList } = useCreateOneRecord({
    objectNameSingular: 'messageList',
  });

  const { enqueueErrorSnackBar } = useSnackBar();

  const handleCreateList = async (searchInput?: string) => {
    const listName = searchInput?.trim() ?? '';
    if (!listName) {
      enqueueErrorSnackBar({
        message: t`고객 분류 이름을 먼저 입력하세요.`,
      });
      return;
    }
    const createdList = await createMessageList({ name: listName });

    if (isDefined(createdList)) {
      campaignState.setListId(createdList.id);
    }
  };

  const audiencePreview = useCampaignAudiencePreview({
    listId:
      campaignState.recipientMode === 'list' ? campaignState.listId : null,
    unsubscribeTopicId: campaignState.unsubscribeTopicId,
  });

  return (
    <StyledFieldGroup>
      <CampaignRecipientHeader>
        <CampaignFieldLabel
          label="수신자"
          help={
            isDefined(audiencePreview)
              ? buildAudienceHint(audiencePreview)
              : t`발송할 고객이 포함된 고객 분류를 선택하세요.`
          }
        />
      </CampaignRecipientHeader>
      <CampaignRecipientSelector
        channel="email"
        mode={campaignState.recipientMode}
        onModeChange={(mode) => {
          campaignState.closeReview();
          campaignState.setRecipientMode(mode);
        }}
        directValue={campaignState.directEmail}
        onDirectValueChange={campaignState.setDirectEmail}
        disabled={campaignState.loading}
      >
        <FormSingleRecordPicker
          objectNameSingulars={['messageList']}
          defaultValue={campaignState.listId ?? undefined}
          onChange={campaignState.setListId}
          onCreate={handleCreateList}
        />
        {isDefined(audiencePreview) && (
          <StyledAudience role="status" aria-atomic="true">
            <Tag
              color="green"
              Icon={IconUsers}
              text={`발송 가능 ${audiencePreview.sendable.toLocaleString('ko-KR')}명`}
            />
          </StyledAudience>
        )}
      </CampaignRecipientSelector>
    </StyledFieldGroup>
  );
};
