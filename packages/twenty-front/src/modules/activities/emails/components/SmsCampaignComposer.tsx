import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { StyledCampaignDraftSaveButton } from '@/activities/emails/components/StyledCampaignDraftSaveButton';
import { type CampaignDraftControls } from '@/activities/emails/types/CampaignDraftControls';
import { CampaignRecipientHeader } from '@/activities/emails/components/CampaignRecipientHeader';
import { StyledCampaignCheckboxLabel } from '@/activities/emails/components/StyledCampaignCheckboxLabel';
import { StyledCampaignOptionRow } from '@/activities/emails/components/StyledCampaignOptionRow';
import { CampaignRecipientSelector } from '@/activities/emails/components/CampaignRecipientSelector';
import { type CampaignRecipientMode } from '@/activities/emails/types/CampaignRecipientMode';
import { sidePanelHeaderActionsElementState } from '@/side-panel/states/sidePanelHeaderActionsElementState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { createPortal } from 'react-dom';
import { SmsCampaignReviewModal } from '@/activities/emails/components/SmsCampaignReviewModal';
import { type SmsAudiencePreview } from '@/activities/emails/types/SmsAudiencePreview';
import { SmsCampaignMessageEditor } from '@/activities/emails/components/SmsCampaignMessageEditor';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { CampaignFieldLabel } from '@/activities/emails/components/CampaignFieldLabel';
import { StyledDispatchForm as StyledForm } from '@/activities/emails/components/CampaignDispatchStyles';
import { gql } from '@apollo/client';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { useRef, useState, type ReactNode } from 'react';
import { StyledCampaignRecipientSection } from '@/activities/emails/components/StyledCampaignRecipientSection';
import { Button, Checkbox } from 'twenty-ui/input';
import { InlineBanner } from 'twenty-ui/feedback';
import { IconAlertTriangle, IconSend } from 'twenty-ui/icon';
import { styled } from '@linaria/react';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';

const StyledWarningBanner = styled(InlineBanner)`
  && {
    margin: 0;
  }
`;

const StyledSetupNotice = styled.div`
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]} 0;
`;

const StyledFieldSection = styled.section`
  && {
    gap: ${themeCssVariables.spacing[2]};
  }
`;

const PREVIEW = gql`
  query PreviewSmsDispatch($input: SmsPreviewInput!) {
    previewSmsDispatch(input: $input) {
      total
      missing
      duplicates
      sms
      lms
      sample
    }
  }
`;
const SUMMARY = gql`
  fragment SmsDispatchFields on SmsDispatchSummary {
    id
    subject
    status
    createdAt
    queued
    accepted
    failed
    unknown
    errors
  }
`;
const SEND = gql`
  mutation SendSmsDispatch($input: SmsSendInput!) {
    sendSmsDispatch(input: $input) {
      ...SmsDispatchFields
    }
  }
  ${SUMMARY}
`;
type Summary = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  queued: number;
  accepted: number;
  failed: number;
  unknown: number;
  errors: string[];
};

export const SmsCampaignComposer = ({
  isSendingDisabled = false,
  isSendingBlocked = false,
  renderDispatchOptions,
  initialDraft,
  draftReference,
  saveDraft,
  savingDraft = false,
}: CampaignDraftControls & {
  isSendingDisabled?: boolean;
  isSendingBlocked?: boolean;
  renderDispatchOptions?: (recipientFields: ReactNode) => ReactNode;
}) => {
  const apolloCoreClient = useApolloCoreClient();
  const sidePanelHeaderActionsElement = useAtomStateValue(
    sidePanelHeaderActionsElementState,
  );
  const [recipientMode, setRecipientMode] = useState<CampaignRecipientMode>(
    initialDraft?.recipientMode ?? 'list',
  );
  const [directPhone, setDirectPhone] = useState(
    initialDraft?.directRecipient ?? '',
  );
  const [listId, setListId] = useState<string | undefined>(
    initialDraft?.listId ?? undefined,
  );
  const [subject, setSubject] = useState(initialDraft?.subject ?? '');
  const [content, setContent] = useState(initialDraft?.body ?? '');
  const [advertising, setAdvertising] = useState(
    initialDraft?.advertising ?? false,
  );
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [preview, setPreview] = useState<SmsAudiencePreview | null>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loadPreview, { loading: previewLoading }] = useLazyQuery<{
    previewSmsDispatch: SmsAudiencePreview;
  }>(PREVIEW, { fetchPolicy: 'network-only' });
  const [send, { loading: sendLoading }] = useMutation<{
    sendSmsDispatch: Summary;
  }>(SEND);
  const [pendingAction, setPendingAction] = useState<'review' | 'send' | null>(
    null,
  );
  // Lock before React renders the pending state to prevent rapid submissions.
  // oxlint-disable-next-line twenty/no-state-useref
  const requestInFlight = useRef(false);
  const sending = sendLoading || pendingAction === 'send';
  const reviewing = previewLoading || pendingAction === 'review';
  const reset = () => {
    setPreview(null);
    setSubmitted(false);
    setError('');
    setRequestId(crypto.randomUUID());
  };
  const bytes = new TextEncoder().encode(content).length;
  const busy = sending || reviewing || savingDraft;
  const recipientCount = (preview?.sms ?? 0) + (preview?.lms ?? 0);
  const canSend =
    recipientMode === 'list' &&
    !isSendingDisabled &&
    !isSendingBlocked &&
    !busy &&
    recipientCount > 0 &&
    !submitted;
  const canReview =
    recipientMode === 'list' &&
    !isSendingDisabled &&
    !isSendingBlocked &&
    !busy &&
    !!listId &&
    !!content.trim() &&
    bytes <= 2000 &&
    !submitted;
  const review = async () => {
    if (!canReview || requestInFlight.current) return;
    requestInFlight.current = true;
    setPendingAction('review');
    setError('');
    setPreview(null);
    try {
      const result = await loadPreview({
        variables: { input: { listId, subject, content, advertising } },
      });
      setPreview(result.data?.previewSmsDispatch ?? null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '미리보기에 실패했습니다.',
      );
    } finally {
      requestInFlight.current = false;
      setPendingAction(null);
    }
  };
  const submit = async () => {
    if (!canSend || requestInFlight.current) return;
    requestInFlight.current = true;
    setPendingAction('send');
    setError('');
    try {
      await send({
        variables: {
          input: {
            requestId,
            listId,
            content,
            advertising,
            subject,
            draft: draftReference,
          },
        },
      });
      setSubmitted(true);
      setPreview(null);
      void apolloCoreClient
        .refetchQueries({
          include: 'active',
          onQueryUpdated: (query) =>
            ['FindManyMessageCampaigns', 'FindOneMessageCampaign'].includes(
              query.queryName ?? '',
            ),
        })
        .catch(() => {
          /* Dispatch succeeded; a list refresh failure must not trigger a resend. */
        });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : '발송 요청에 실패했습니다.',
      );
    } finally {
      requestInFlight.current = false;
      setPendingAction(null);
    }
  };
  const recipientFields = (
    <StyledCampaignRecipientSection>
      <CampaignRecipientHeader>
        <CampaignFieldLabel
          label="수신자"
          help="고객 또는 워크스페이스 계정에 연결된 구성원의 휴대전화번호로 발송합니다. 번호 없음·중복 제외 · 가인지 문자 발송 요금 적용"
        />
      </CampaignRecipientHeader>
      <CampaignRecipientSelector
        channel="sms"
        mode={recipientMode}
        onModeChange={(mode) => {
          if (busy) return;
          reset();
          setRecipientMode(mode);
        }}
        directValue={directPhone}
        onDirectValueChange={setDirectPhone}
        disabled={busy}
      >
        <FormSingleRecordPicker
          objectNameSingulars={['messageList']}
          defaultValue={listId}
          onChange={(value) => {
            if (!busy) {
              reset();
              setListId(value ?? undefined);
            }
          }}
        />
      </CampaignRecipientSelector>
    </StyledCampaignRecipientSection>
  );

  return (
    <>
      {isSendingDisabled && (
        <StyledSetupNotice role="alert">
          <StyledWarningBanner
            color="danger"
            LeftIcon={IconAlertTriangle}
            message="문자 발송 설정이 완료되지 않아 전송할 수 없습니다."
          />
        </StyledSetupNotice>
      )}
      {renderDispatchOptions?.(recipientFields)}
      <StyledForm aria-busy={busy}>
        {!renderDispatchOptions && recipientFields}
        <label>
          제목 (선택)
          <input
            aria-label="제목 (선택)"
            placeholder="제목을 입력하세요"
            maxLength={15}
            value={subject}
            disabled={busy}
            onChange={(event) => {
              reset();
              setSubject(event.target.value);
            }}
          />
        </label>
        <StyledFieldSection aria-label="광고 문자 설정">
          <StyledCampaignOptionRow>
            <StyledCampaignCheckboxLabel>
              <Checkbox
                hoverable={false}
                aria-describedby={
                  advertising ? 'sms-advertising-help' : undefined
                }
                checked={advertising}
                disabled={busy}
                onCheckedChange={(checked) => {
                  reset();
                  setAdvertising(checked);
                }}
              />
              <span>광고 문자</span>
            </StyledCampaignCheckboxLabel>
          </StyledCampaignOptionRow>
          {advertising && (
            <div id="sms-advertising-help">
              <StyledWarningBanner
                color="danger"
                LeftIcon={IconAlertTriangle}
                message="(광고)로 시작하고 발신자 이름 및 등록된 무료수신거부 080 번호를 메시지에 넣어주세요."
              />
            </div>
          )}
        </StyledFieldSection>
        <StyledFieldSection>
          <CampaignFieldLabel
            label="메시지"
            help="고객 정보 메뉴에서 이름·기업을 넣을 수 있어요. 정보가 없으면 빈칸으로 표시됩니다."
          />
          <SmsCampaignMessageEditor
            value={content}
            disabled={busy}
            isLongMessage={!!subject.trim() || bytes > 90}
            onChange={(value) => {
              reset();
              setContent(value);
            }}
          />
        </StyledFieldSection>
        {sidePanelHeaderActionsElement &&
          createPortal(
            <>
              {saveDraft && (
                <StyledCampaignDraftSaveButton
                  title={savingDraft ? '저장 중…' : '임시 저장'}
                  size="small"
                  variant="primary"
                  disabled={busy || submitted}
                  onClick={() =>
                    saveDraft({
                      recipientMode,
                      directRecipient: directPhone,
                      listId: listId ?? null,
                      subject,
                      body: content,
                      advertising,
                    })
                  }
                />
              )}
              <Button
                title={
                  submitted
                    ? '발송 요청 완료'
                    : reviewing
                      ? '수신자 확인 중…'
                      : '발송 전 검토'
                }
                isLoading={reviewing}
                size="small"
                variant="primary"
                accent="blue"
                Icon={IconSend}
                onClick={review}
                disabled={!canReview || !!preview}
              />
            </>,
            sidePanelHeaderActionsElement,
          )}
        {error && !preview && <div role="alert">{error}</div>}
        {preview && (
          <SmsCampaignReviewModal
            preview={preview}
            sending={sending}
            canSend={canSend}
            error={error}
            onClose={() => {
              if (requestInFlight.current) return;
              setPreview(null);
              setError('');
            }}
            onConfirm={submit}
          />
        )}
        {submitted && (
          <div role="status">
            문자 발송 요청을 저장했습니다. 최종 발송 결과는 가인지 어드민에서
            확인하세요.
          </div>
        )}
      </StyledForm>
    </>
  );
};
