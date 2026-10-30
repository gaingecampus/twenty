import { type CampaignDraftControls } from '@/activities/emails/types/CampaignDraftControls';
import { CampaignRecipientHeader } from '@/activities/emails/components/CampaignRecipientHeader';
import { StyledCampaignCheckboxLabel } from '@/activities/emails/components/StyledCampaignCheckboxLabel';
import { StyledCampaignOptionRow } from '@/activities/emails/components/StyledCampaignOptionRow';
import { CampaignRecipientSelector } from '@/activities/emails/components/CampaignRecipientSelector';
import { type CampaignRecipientMode } from '@/activities/emails/types/CampaignRecipientMode';
import { sidePanelHeaderActionsElementState } from '@/side-panel/states/sidePanelHeaderActionsElementState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { createPortal } from 'react-dom';
import { SmsCampaignMessageEditor } from '@/activities/emails/components/SmsCampaignMessageEditor';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { CampaignFieldLabel } from '@/activities/emails/components/CampaignFieldLabel';
import {
  StyledDispatchForm as StyledForm,
  StyledDispatchCard as StyledCard,
} from '@/activities/emails/components/CampaignDispatchStyles';
import { gql } from '@apollo/client';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { useState, type ReactNode } from 'react';
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
type Preview = {
  total: number;
  missing: number;
  duplicates: number;
  sms: number;
  lms: number;
  sample: string;
};
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
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loadPreview, { loading: previewLoading }] = useLazyQuery<{
    previewSmsDispatch: Preview;
  }>(PREVIEW, { fetchPolicy: 'network-only' });
  const [send, { loading: sending }] = useMutation<{
    sendSmsDispatch: Summary;
  }>(SEND);
  const reset = () => {
    setPreview(null);
    setSubmitted(false);
    setError('');
    setRequestId(crypto.randomUUID());
  };
  const bytes = new TextEncoder().encode(content).length;
  const busy = sending || previewLoading || savingDraft;
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
    if (!canReview) return;
    setError('');
    try {
      const result = await loadPreview({
        variables: { input: { listId, subject, content, advertising } },
      });
      setPreview(result.data?.previewSmsDispatch ?? null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '미리보기에 실패했습니다.',
      );
    }
  };
  const submit = async () => {
    if (
      recipientMode !== 'list' ||
      isSendingDisabled ||
      isSendingBlocked ||
      !preview ||
      sending ||
      submitted
    )
      return;
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
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : '발송 요청에 실패했습니다.',
      );
    }
  };
  const recipientFields = (
    <StyledCampaignRecipientSection>
      <CampaignRecipientHeader>
        <CampaignFieldLabel
          label="수신자"
          help="번호 없음·중복 제외 · 가인지 문자 발송 요금 적용"
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
      <StyledForm>
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
                <Button
                  title={savingDraft ? '저장 중…' : '임시 저장'}
                  size="small"
                  variant="secondary"
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
                title="발송 전 검토"
                size="small"
                variant="primary"
                accent="blue"
                Icon={IconSend}
                onClick={review}
                disabled={!canReview}
              />
            </>,
            sidePanelHeaderActionsElement,
          )}
        {error && <div role="alert">{error}</div>}
        {preview && (
          <StyledCard aria-label="문자 발송 확인">
            <strong>발송 전 검토</strong>
            <p>
              전체 {preview.total}명 · 번호 없음/오류 {preview.missing}명 · 중복{' '}
              {preview.duplicates}명
            </p>
            <p>
              SMS {preview.sms}건 · LMS {preview.lms}건
            </p>
            <pre>{preview.sample}</pre>
            <Button
              title={`${preview.sms + preview.lms}명에게 문자 발송`}
              variant="primary"
              accent="blue"
              onClick={submit}
              disabled={
                isSendingDisabled ||
                isSendingBlocked ||
                busy ||
                preview.sms + preview.lms === 0
              }
            />
          </StyledCard>
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
