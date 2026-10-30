import {
  StyledDispatchForm as StyledForm,
  StyledDispatchCard as StyledCard,
} from '@/activities/emails/components/CampaignDispatchStyles';
import { gql } from '@apollo/client';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { InlineBanner } from 'twenty-ui/feedback';
import { IconAlertTriangle } from 'twenty-ui/icon';
import { styled } from '@linaria/react';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';

const StyledSetupBanner = styled(InlineBanner)`
  margin-bottom: 0;
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
const HISTORY = gql`
  query SmsDispatchHistory {
    smsDispatchHistory {
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
}: {
  isSendingDisabled?: boolean;
}) => {
  const [listId, setListId] = useState<string>();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
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
  const {
    data,
    error: historyError,
    refetch,
  } = useQuery<{ smsDispatchHistory: Summary[] }>(HISTORY, {
    fetchPolicy: 'network-only',
    skip: isSendingDisabled,
  });
  const reset = () => {
    setPreview(null);
    setSubmitted(false);
    setError('');
    setRequestId(crypto.randomUUID());
  };
  const bytes = new TextEncoder().encode(content).length;
  const busy = sending || previewLoading;
  const review = async () => {
    if (isSendingDisabled) return;
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
    if (isSendingDisabled || !preview || sending || submitted) return;
    setError('');
    try {
      await send({
        variables: {
          input: { requestId, listId, content, advertising, subject },
        },
      });
      setSubmitted(true);
      setPreview(null);
      await refetch();
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
      <label>받는 고객</label>
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
      <label>
        제목 (선택)
        <input
          aria-label="문자 발송 제목"
          maxLength={15}
          value={subject}
          disabled={busy}
          onChange={(event) => {
            reset();
            setSubject(event.target.value);
          }}
        />
      </label>
      <label>
        문자 내용
        <textarea
          aria-label="문자 내용"
          value={content}
          disabled={busy}
          onChange={(event) => {
            reset();
            setContent(event.target.value);
          }}
          placeholder="{{fullName}}님, 안녕하세요."
        />
      </label>
      <div>
        {bytes.toLocaleString()} / 2,000바이트 ·{' '}
        {subject.trim() || bytes > 90 ? 'LMS 장문' : 'SMS 단문'}
      </div>
      <section>
        <small>
          이름 {'{{fullName}}'} · 기업 {'{{companyName}}'}
        </small>
      </section>
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
      <section>
        <small>번호 없음·중복 제외 · 가인지 문자 발송 요금 적용</small>
      </section>
      <Button
        title="발송 전 검토"
        onClick={review}
        disabled={
          isSendingDisabled ||
          busy ||
          !listId ||
          !content.trim() ||
          bytes > 2000 ||
          submitted
        }
      />
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
              isSendingDisabled || busy || preview.sms + preview.lms === 0
            }
          />
        </StyledCard>
      )}
      {submitted && (
        <div role="status">
          문자 발송 요청을 저장했습니다. 아래 접수 내역을 새로고침해 확인하세요.
        </div>
      )}
      <section>
        <strong>최근 발송 내역</strong>
        <Button
          title="접수 내역 새로고침"
          disabled={isSendingDisabled}
          onClick={() => {
            if (!isSendingDisabled) void refetch();
          }}
        />
        <small>
          접수 완료는 가인지 SMS 대기열 접수를 뜻합니다. 최종 발송 결과는 가인지
          어드민에서 확인하세요. 확인 필요 건은 결과 확인 전 재발송하지 마세요.
        </small>
        {historyError && <div role="alert">{historyError.message}</div>}
        {!isSendingDisabled &&
          data?.smsDispatchHistory.map((row) => (
            <StyledCard key={row.id}>
              <strong>{row.subject}</strong>
              <p>{new Date(row.createdAt).toLocaleString('ko-KR')}</p>
              <p>
                대기 {row.queued} · 접수 완료 {row.accepted} · 실패 {row.failed}{' '}
                · 처리 중/확인 필요 {row.unknown}
              </p>
              {row.errors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </StyledCard>
          ))}
      </section>
    </StyledForm>
  );
};
