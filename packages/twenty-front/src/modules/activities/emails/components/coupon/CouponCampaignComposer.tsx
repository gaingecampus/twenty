import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useRef, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { Select } from '@/ui/input/components/Select';
import {
  COUPON_CAPABILITIES,
  COUPON_HISTORY,
  PREVIEW_COUPON,
  SIMULATE_COUPON,
  SEND_COUPON,
  REFRESH_COUPON,
  type CouponCapabilities,
  type CouponDispatch,
} from './coupon-operations';

const StyledForm = styled.div`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]};
  section,
  label {
    display: flex;
    flex-direction: column;
    gap: ${themeCssVariables.spacing[2]};
  }
  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
  small {
    color: ${themeCssVariables.font.color.secondary};
  }
  input,
  textarea {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: ${themeCssVariables.border.radius.sm};
    box-sizing: border-box;
    color: inherit;
    font: inherit;
    width: 100%;
  }
  input {
    height: var(--t-input-height);
    padding: 0 var(--t-input-padding-x);
  }
  input[type='checkbox'] {
    width: auto;
    height: auto;
    align-self: flex-start;
  }
  textarea {
    min-height: 100px;
    padding: ${themeCssVariables.spacing[2]};
    resize: vertical;
  }
`;

const statusLabels: Record<string, string> = {
  PREVIEW: '검토 대기',
  SIMULATED: '검증 완료 · 실제 발송 없음',
  SIMULATED_FAILED: '실패 상황 재현 · 실제 발송 없음',
  UNKNOWN: '결과 확인 필요 · 재발송 차단',
  SUBMITTING: '요청 중 · 응답이 오래 없으면 업체 확인 필요',
  PROCESSING: '센드비 발급·발송 처리 중',
  SENT: '센드비 발송 완료',
  CANCELLED: '결제 취소',
  AVAILABLE: '쿠폰 사용 가능',
  UNAVAILABLE: '쿠폰 사용 불가',
};

export const CouponCampaignComposer = () => {
  const [mode, setMode] = useState('SIMULATION');
  const [title, setTitle] = useState('가인지 CRM 쿠폰 선물');
  const [confirmed, setConfirmed] = useState(false);
  const [target, setTarget] = useState('phone');
  const [testPhone, setTestPhone] = useState('');
  const [listId, setListId] = useState<string>();
  const [productId, setProductId] = useState('');
  const [message, setMessage] = useState(
    '참여해 주셔서 감사합니다. 쿠폰을 보내드립니다.',
  );
  const [scenario, setScenario] = useState('SUCCESS');
  const [quote, setQuote] = useState<CouponDispatch | null>(null);
  const [result, setResult] = useState<CouponDispatch | null>(null);
  const [error, setError] = useState('');
  // Request sequencing and submission locks do not drive rendered state.
  // oxlint-disable-next-line twenty/no-state-useref
  const revision = useRef(0);
  // oxlint-disable-next-line twenty/no-state-useref
  const submitting = useRef(false);
  const {
    data,
    loading,
    error: capabilityError,
  } = useQuery<{ couponCapabilities: CouponCapabilities }>(COUPON_CAPABILITIES);
  const {
    data: history,
    error: historyError,
    refetch,
  } = useQuery<{ couponDispatchHistory: CouponDispatch[] }>(COUPON_HISTORY, {
    fetchPolicy: 'network-only',
  });
  const [preview, { loading: reviewing }] = useMutation<{
    previewCouponDispatch: CouponDispatch;
  }>(PREVIEW_COUPON);
  const [simulate, { loading: running }] = useMutation<{
    simulateCouponDispatch: CouponDispatch;
  }>(SIMULATE_COUPON);
  const [send, { loading: sending }] = useMutation<{
    sendCouponDispatch: CouponDispatch;
  }>(SEND_COUPON);
  const [refresh, { loading: refreshing }] = useMutation<{
    refreshCouponDispatch: CouponDispatch;
  }>(REFRESH_COUPON);
  const busy = reviewing || running || sending || refreshing;
  const capabilities = data?.couponCapabilities;
  const invalidate = () => {
    revision.current++;
    setConfirmed(false);
    setQuote(null);
    setResult(null);
    setError('');
  };
  const failureMessage = (failure: unknown) =>
    failure instanceof Error ? failure.message : '요청을 처리하지 못했습니다.';

  const review = async () => {
    const currentRevision = revision.current;
    setError('');
    setQuote(null);
    setConfirmed(false);
    setResult(null);
    try {
      const response = await preview({
        variables: {
          input: {
            mode,
            title,
            productId,
            message,
            scenario,
            ...(target === 'phone' ? { testPhone } : { listId }),
          },
        },
      });
      if (currentRevision === revision.current)
        setQuote(response.data?.previewCouponDispatch ?? null);
    } catch (failure) {
      if (currentRevision === revision.current)
        setError(failureMessage(failure));
    }
  };
  const run = async () => {
    if (!quote || submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      if (quote.mode === 'LIVE') {
        if (!confirmed) return;
        const response = await send({
          variables: {
            input: { quoteId: quote.id, confirmedCost: quote.estimatedCost },
          },
        });
        setResult(response.data?.sendCouponDispatch ?? null);
      } else {
        const response = await simulate({
          variables: { input: { quoteId: quote.id } },
        });
        setResult(response.data?.simulateCouponDispatch ?? null);
      }
      setQuote(null);
      // A history failure must not turn a completed operation into a retry prompt.
      await refetch().catch(() => undefined);
    } catch (failure) {
      setError(failureMessage(failure));
      // A lost GraphQL response does not prove that payment failed. Recover the durable history.
      await refetch().catch(() => undefined);
    } finally {
      submitting.current = false;
    }
  };

  return (
    <StyledForm>
      <section aria-label="쿠폰 연동 상태">
        <strong>카카오 쿠폰 · 센드비</strong>
        <p role="status">
          {mode === 'SIMULATION'
            ? '검증 모드 · 실제 카카오 전송과 과금이 없습니다.'
            : capabilities?.environment === 'production'
              ? '운영 연동 · 카카오 쿠폰 발송 시 센드비 캐시가 차감됩니다.'
              : '센드비 개발 서버 연동 · 발급 테스트 환경'}
        </p>
        {capabilities && <small>{capabilities.liveBlockedReason}</small>}
        <a
          href="https://guttural-mouth-47c.notion.site/API-_v0-8-26503bacc2ba80899455e8d7570b131d"
          target="_blank"
          rel="noreferrer"
        >
          센드비 API 명세서
        </a>
      </section>
      {loading && <p>연동 정보를 불러오는 중…</p>}
      {capabilityError && <p role="alert">{capabilityError.message}</p>}
      {capabilities && (
        <>
          <Select
            dropdownId="coupon-mode"
            label="발송 모드"
            value={mode}
            disabled={busy}
            options={[
              { value: 'SIMULATION', label: '내부 검증 · 과금 없음' },
              ...(capabilities.liveAvailable
                ? [
                    {
                      value: 'LIVE',
                      label:
                        capabilities.environment === 'production'
                          ? '실제 카카오 발송'
                          : '센드비 개발 서버',
                    },
                  ]
                : []),
            ]}
            onChange={(value) => {
              invalidate();
              setMode(value);
              setProductId('');
            }}
            fullWidth
          />
          <Select
            dropdownId="coupon-target"
            label="받는 고객"
            value={target}
            disabled={busy}
            options={[
              { value: 'phone', label: '휴대전화번호 직접 입력' },
              { value: 'list', label: '고객 목록' },
            ]}
            onChange={(value) => {
              invalidate();
              setTarget(value);
            }}
            fullWidth
          />
          {target === 'phone' ? (
            <label>
              받는 분 휴대전화번호
              <input
                aria-label="쿠폰 테스트 번호"
                type="tel"
                autoComplete="off"
                value={testPhone}
                disabled={busy}
                onChange={(event) => {
                  invalidate();
                  setTestPhone(event.target.value);
                }}
                placeholder="01012345678"
              />
            </label>
          ) : (
            <FormSingleRecordPicker
              objectNameSingulars={['messageList']}
              defaultValue={listId}
              onChange={(value) => {
                if (!busy) {
                  invalidate();
                  setListId(value ?? undefined);
                }
              }}
            />
          )}
          <Select
            dropdownId="coupon-product"
            label={mode === 'LIVE' ? '센드비 상품' : '테스트 상품'}
            value={productId}
            disabled={busy}
            options={(mode === 'LIVE'
              ? capabilities.liveProducts
              : capabilities.products
            ).map((product) => ({
              value: product.id,
              label: `${product.name} · ${product.price.toLocaleString()}원`,
            }))}
            emptyOption={{ value: '', label: '상품 선택' }}
            onChange={(value) => {
              invalidate();
              setProductId(value);
            }}
            fullWidth
          />
          {mode === 'LIVE' && (
            <label>
              쿠폰 제목
              <input
                aria-label="쿠폰 제목"
                value={title}
                maxLength={100}
                disabled={busy}
                onChange={(event) => {
                  invalidate();
                  setTitle(event.target.value);
                }}
              />
            </label>
          )}
          <label>
            메시지
            <textarea
              aria-label="쿠폰 안내 메시지"
              maxLength={500}
              value={message}
              disabled={busy}
              onChange={(event) => {
                invalidate();
                setMessage(event.target.value);
              }}
            />
          </label>
          {mode === 'SIMULATION' && (
            <Select
              dropdownId="coupon-scenario"
              label="검증 상황"
              value={scenario}
              disabled={busy}
              options={[
                { value: 'SUCCESS', label: '정상 처리' },
                { value: 'DELIVERY_FAILED', label: '카카오 전달 실패' },
                { value: 'UNKNOWN', label: '응답 불명확' },
                { value: 'INSUFFICIENT_BALANCE', label: '잔액 부족' },
              ]}
              onChange={(value) => {
                invalidate();
                setScenario(value);
              }}
              fullWidth
            />
          )}
          <small>
            {mode === 'LIVE'
              ? '센드비 판매가 기준 · 1회 발송 한도 '
              : '샘플 상품·가격 기준 · 검증 예산 '}
            {(mode === 'LIVE'
              ? capabilities.liveBudget
              : capabilities.simulationBudget
            ).toLocaleString()}
            원 · 최대 1,000명
          </small>
          <Button
            title="대상·비용 검토"
            onClick={review}
            disabled={
              busy ||
              !productId ||
              !message.trim() ||
              (mode === 'LIVE' && !title.trim()) ||
              (target === 'phone' ? !testPhone.trim() : !listId)
            }
          />
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {quote && (
        <section aria-label="쿠폰 발송 전 검토">
          <strong>
            {quote.product.name} ·{' '}
            {quote.product.validityDays > 0
              ? `유효기간 ${quote.product.validityDays}일`
              : '유효기간은 상품 안내 참조'}
            {quote.mode === 'SIMULATION' && ' (샘플)'}
          </strong>
          <p>
            대상 {quote.recipientCount}명 · 번호 없음/오류 {quote.missing}명 ·
            중복 {quote.duplicates}명
          </p>
          <p>
            예상 비용 {quote.estimatedCost.toLocaleString()}원
            {quote.mode === 'SIMULATION' && ' · 실제 결제 0원'}
          </p>
          <p>{quote.message}</p>
          <small>
            검토 유효시간{' '}
            {new Date(quote.expiresAt).toLocaleTimeString('ko-KR')}까지
          </small>
          {quote.mode === 'LIVE' && (
            <label>
              <input
                type="checkbox"
                checked={confirmed}
                disabled={busy}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              {quote.recipientCount}명에게{' '}
              {quote.estimatedCost.toLocaleString()}원 상당의 쿠폰 주문을
              요청합니다.
              {quote.environment === 'production'
                ? ' 실제 결제·발송에 동의합니다.'
                : ' 센드비 개발 환경 주문임을 확인했습니다.'}
            </label>
          )}
          <Button
            title={
              quote.mode === 'LIVE'
                ? '확인한 금액으로 쿠폰 주문'
                : '외부 전송 없이 검증 실행'
            }
            variant="primary"
            accent="blue"
            onClick={run}
            disabled={
              busy ||
              (quote.mode === 'LIVE' && !confirmed) ||
              quote.estimatedCost >
                (quote.mode === 'LIVE'
                  ? (capabilities?.liveBudget ?? 0)
                  : (capabilities?.simulationBudget ?? 0))
            }
          />
        </section>
      )}
      {result && (
        <section role="status" aria-label="쿠폰 검증 결과">
          <strong>{statusLabels[result.status] ?? result.status}</strong>
          {result.status === 'UNKNOWN' && (
            <p>
              주문거래번호로 센드비에 결과를 확인하세요. 동일한 요청을 다시
              실행해도 재발급하지 않습니다.
            </p>
          )}
        </section>
      )}
      <section aria-label="쿠폰 검증 이력">
        <strong>최근 쿠폰 발송·검증 이력</strong>
        <Button
          title="쿠폰 내역 새로고침"
          disabled={busy}
          onClick={() => {
            void refetch().catch(() => setError('내역을 불러오지 못했습니다.'));
          }}
        />
        {historyError && <p role="alert">{historyError.message}</p>}
        {history?.couponDispatchHistory.length === 0 && (
          <p>아직 검증 내역이 없습니다.</p>
        )}
        {history?.couponDispatchHistory.map((dispatch) => (
          <section key={dispatch.id}>
            <strong>{dispatch.product.name}</strong>
            <small>
              {new Date(dispatch.createdAt).toLocaleString('ko-KR')} ·{' '}
              {dispatch.recipientCount}명
            </small>
            <small>
              {dispatch.mode === 'SIMULATION'
                ? '내부 검증'
                : dispatch.environment === 'production'
                  ? '운영 발송'
                  : '개발 서버'}
            </small>
            <p>{statusLabels[dispatch.status] ?? dispatch.status}</p>
            {dispatch.orderTrId && (
              <small>주문거래번호 {dispatch.orderTrId}</small>
            )}
            {dispatch.actualCost != null && (
              <small>
                센드비 결제금액 {dispatch.actualCost.toLocaleString()}원
              </small>
            )}
            {dispatch.orderId && (
              <Button
                title="센드비 발급 상태 조회"
                disabled={busy}
                onClick={async () => {
                  try {
                    await refresh({
                      variables: { input: { quoteId: dispatch.id } },
                    });
                    await refetch();
                  } catch (failure) {
                    setError(failureMessage(failure));
                  }
                }}
              />
            )}
            {dispatch.recipients.slice(0, 5).map((recipient, index) => (
              <small key={`${recipient.personId ?? index}-${recipient.phone}`}>
                {recipient.phone} ·{' '}
                {statusLabels[recipient.status] ?? recipient.status}
              </small>
            ))}
            {dispatch.recipients.length > 5 && (
              <small>외 {dispatch.recipients.length - 5}명</small>
            )}
          </section>
        ))}
      </section>
    </StyledForm>
  );
};
