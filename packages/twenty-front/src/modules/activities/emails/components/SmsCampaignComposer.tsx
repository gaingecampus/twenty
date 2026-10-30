import { sidePanelHeaderActionsElementState } from '@/side-panel/states/sidePanelHeaderActionsElementState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { createPortal } from 'react-dom';
import { CampaignBodyVariablePicker } from '@/activities/emails/components/CampaignBodyVariablePicker';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { CampaignFieldLabel } from '@/activities/emails/components/CampaignFieldLabel';
import {
  StyledDispatchForm as StyledForm,
  StyledDispatchCard as StyledCard,
} from '@/activities/emails/components/CampaignDispatchStyles';
import { gql } from '@apollo/client';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { useRef, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { InlineBanner } from 'twenty-ui/feedback';
import { IconAlertTriangle, IconSend } from 'twenty-ui/icon';
import { styled } from '@linaria/react';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';

const StyledSetupBanner = styled(InlineBanner)`
  margin-bottom: 0;
`;

const StyledFieldSection = styled.section`
  && {
    gap: ${themeCssVariables.spacing[2]};
  }

  textarea {
    background: var(
      --t-input-background,
      ${themeCssVariables.background.transparent.lighter}
    );
    min-height: 180px;
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
}: {
  isSendingDisabled?: boolean;
  isSendingBlocked?: boolean;
}) => {
  const sidePanelHeaderActionsElement = useAtomStateValue(
    sidePanelHeaderActionsElementState,
  );
  const [listId, setListId] = useState<string>();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const [advertising, setAdvertising] = useState(false);
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
  const busy = sending || previewLoading;
  const canReview =
    !isSendingDisabled &&
    !isSendingBlocked &&
    !busy &&
    !!listId &&
    !!content.trim() &&
    bytes <= 2000 &&
    !submitted;
  const insertCustomerInfo = (text: string) => {
    if (busy) return;
    const input = contentInputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    reset();
    setContent(content.slice(0, start) + text + content.slice(end));
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + text.length, start + text.length);
    });
  };
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
          input: { requestId, listId, content, advertising, subject },
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
  return (
    <StyledForm>
      {isSendingDisabled && (
        <div role="alert">
          <StyledSetupBanner
            color="danger"
            LeftIcon={IconAlertTriangle}
            message="문자 발송 설정이 완료되지 않아 전송할 수 없습니다."
          />
        </div>
      )}
      <StyledFieldSection>
        <CampaignFieldLabel
          label="받는 고객"
          help="번호 없음·중복 제외 · 가인지 문자 발송 요금 적용"
        />
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
      </StyledFieldSection>
      <label>
        제목 (선택)
        <input
          aria-label="문자 발송 제목"
          placeholder="제목을 입력하세요 (선택)"
          maxLength={15}
          value={subject}
          disabled={busy}
          onChange={(event) => {
            reset();
            setSubject(event.target.value);
          }}
        />
      </label>
      <StyledFieldSection>
        <CampaignFieldLabel
          label="메시지"
          help="고객 정보 메뉴에서 이름·기업을 넣을 수 있어요. 정보가 없으면 빈칸으로 표시됩니다."
        />
        <CampaignBodyVariablePicker
          variables={['fullName', 'companyName']}
          disabled={busy}
          onInsert={insertCustomerInfo}
        />
        <textarea
          ref={contentInputRef}
          aria-label="문자 내용"
          value={content}
          disabled={busy}
          onChange={(event) => {
            reset();
            setContent(event.target.value);
          }}
          placeholder="고객에게 전할 내용을 입력하세요"
        />
        <small>
          {bytes.toLocaleString()} / 2,000바이트 ·{' '}
          {subject.trim() || bytes > 90 ? 'LMS 장문' : 'SMS 단문'}
        </small>
      </StyledFieldSection>
      <label>
        <input
          type="checkbox"
          checked={advertising}
          disabled={busy}
          onChange={(event) => {
            reset();
            setAdvertising(event.target.checked);
          }}
        />{' '}
        광고 문자
      </label>
      {advertising && (
        <small>
          (광고)로 시작하고 발신자 이름 및 등록된 무료수신거부 080 번호를 본문에
          넣어주세요.
        </small>
      )}
      {sidePanelHeaderActionsElement &&
        createPortal(
          <Button
            title="발송 전 검토"
            size="small"
            variant="primary"
            accent="blue"
            Icon={IconSend}
            onClick={review}
            disabled={!canReview}
          />,
          sidePanelHeaderActionsElement,
        )}
      {error && <div role="alert">{error}</div>}
      {preview && (
        <StyledCard aria-label="문자 발송 확인">
          <strong>발송 전 확인</strong>
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
  );
};
