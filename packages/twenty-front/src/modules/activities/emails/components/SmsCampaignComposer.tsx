import { gql } from '@apollo/client';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';

const StyledForm = styled.div`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
  input,
  textarea {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: ${themeCssVariables.border.radius.sm};
    box-sizing: border-box;
    color: inherit;
    font: inherit;
    padding: ${themeCssVariables.spacing[3]};
    width: 100%;
  }
  textarea {
    min-height: 160px;
    resize: vertical;
  }
  input[type='checkbox'] {
    width: auto;
  }
  pre {
    font: inherit;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
`;
const StyledCard = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
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

export const SmsCampaignComposer = () => {
  const [listId, setListId] = useState<string>();
  const [subject, setSubject] = useState('심방콜 문자');
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
    setError('');
    try {
      const result = await loadPreview({
        variables: { input: { listId, content, advertising } },
      });
      setPreview(result.data?.previewSmsDispatch ?? null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '미리보기에 실패했습니다.',
      );
    }
  };
  const submit = async () => {
    if (!preview || sending || submitted) return;
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
      <h3>문자 단체 발송 · 뿌리오</h3>
      <label>동반 고객 목록</label>
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
        발송 제목
        <input
          aria-label="문자 발송 제목"
          maxLength={30}
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
        {bytes <= 90 ? 'SMS 단문' : 'LMS 장문'}
      </div>
      <small>
        이름: {'{{fullName}}'} · 연결 기업: {'{{companyName}}'}. 개인화 후
        길이로 SMS/LMS를 구분합니다. 한글은 안전한 발송을 위해 UTF-8 바이트로
        계산합니다.
      </small>
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
        광고 문자 (광고 수신거부 적용)
      </label>
      {advertising && (
        <small>
          (광고)로 시작하고 발신자 이름 및 등록된 무료수신거부 080 번호를 본문에
          넣어주세요.
        </small>
      )}
      <small>
        등록된 고객의 대표 휴대전화번호로 발송합니다. 번호가 없는 멤버·고객과
        중복 번호는 제외합니다. 요금은 뿌리오 계정의 SMS/LMS 단가에 따라
        부과됩니다.
      </small>
      <Button
        title="수신 대상·내용 미리보기"
        onClick={review}
        disabled={
          busy ||
          !listId ||
          !subject.trim() ||
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
            disabled={busy || preview.sms + preview.lms === 0}
          />
        </StyledCard>
      )}
      {submitted && (
        <div role="status">
          문자 발송 요청을 저장했습니다. 아래 접수 내역을 새로고침해 확인하세요.
        </div>
      )}
      <h3>내 문자 접수 내역</h3>
      <Button title="접수 내역 새로고침" onClick={() => void refetch()} />
      <small>
        접수 완료는 최종 도착을 뜻하지 않습니다. 최종 결과·잔액 부족·수신거부는{' '}
        <a
          href="https://www.ppurio.com/result/message"
          target="_blank"
          rel="noreferrer"
        >
          뿌리오 발송 결과
        </a>
        와 연동 사용내역에서 확인하세요. 확인 필요 건은 재발송 전에 확인하세요.
      </small>
      {historyError && <div role="alert">{historyError.message}</div>}
      {data?.smsDispatchHistory.map((row) => (
        <StyledCard key={row.id}>
          <strong>{row.subject}</strong>
          <p>{new Date(row.createdAt).toLocaleString('ko-KR')}</p>
          <p>
            대기 {row.queued} · 접수 완료 {row.accepted} · 실패 {row.failed} ·
            처리 중/확인 필요 {row.unknown}
          </p>
          {row.errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </StyledCard>
      ))}
    </StyledForm>
  );
};
