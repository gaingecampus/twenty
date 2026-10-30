import { CampaignRecipientHeader } from '@/activities/emails/components/CampaignRecipientHeader';
import { CampaignRecipientSelector } from '@/activities/emails/components/CampaignRecipientSelector';
import { CampaignFieldLabel } from '@/activities/emails/components/CampaignFieldLabel';
import { sidePanelHeaderActionsElementState } from '@/side-panel/states/sidePanelHeaderActionsElementState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { createPortal } from 'react-dom';
import {
  StyledDispatchForm as StyledForm,
  StyledDispatchCard as StyledCard,
} from '@/activities/emails/components/CampaignDispatchStyles';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRef, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { Tag } from 'twenty-ui/data-display';
import { IconAlertTriangle, IconSend, IconUsers } from 'twenty-ui/icon';
import {
  StyledCouponBanner,
  StyledCouponSummary,
} from './CouponCampaignComposerStyles';

import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { Select } from '@/ui/input/components/Select';
import {
  COUPON_CAPABILITIES,
  PREVIEW_COUPON,
  SIMULATE_COUPON,
  SEND_COUPON,
  type CouponCapabilities,
  type CouponDispatch,
} from './coupon-operations';

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

export const CouponCampaignComposer = ({
  isSendingDisabled = false,
}: {
  isSendingDisabled?: boolean;
}) => {
  const sidePanelHeaderActionsElement = useAtomStateValue(
    sidePanelHeaderActionsElementState,
  );
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
  const [preview, { loading: reviewing }] = useMutation<{
    previewCouponDispatch: CouponDispatch;
  }>(PREVIEW_COUPON);
  const [simulate, { loading: running }] = useMutation<{
    simulateCouponDispatch: CouponDispatch;
  }>(SIMULATE_COUPON);
  const [send, { loading: sending }] = useMutation<{
    sendCouponDispatch: CouponDispatch;
  }>(SEND_COUPON);
  const busy = reviewing || running || sending;
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
    if (isSendingDisabled || busy) return;
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
    if (isSendingDisabled || !quote || submitting.current) return;
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
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      submitting.current = false;
    }
  };

  return (
    <StyledForm>
      {loading && <p>연동 정보를 불러오는 중…</p>}
      {capabilityError && <p role="alert">{capabilityError.message}</p>}
      {capabilities && (
        <>
          <section aria-label="수신자">
            <CampaignRecipientHeader>
              <span>수신자</span>
            </CampaignRecipientHeader>
            <CampaignRecipientSelector
              channel="coupon"
              mode={target === 'phone' ? 'direct' : 'list'}
              onModeChange={(mode) => {
                invalidate();
                setTarget(mode === 'direct' ? 'phone' : 'list');
              }}
              directValue={testPhone}
              onDirectValueChange={(value) => {
                invalidate();
                setTestPhone(value);
              }}
              disabled={busy}
            >
              {target === 'list' && (
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
            </CampaignRecipientSelector>
          </section>
          <section aria-label="쿠폰 상품">
            <CampaignFieldLabel
              label={mode === 'LIVE' ? '센드비 상품' : '테스트 상품'}
              help={
                mode === 'LIVE' ? '센드비 판매가 기준' : '샘플 상품·가격 기준'
              }
            />
            <Select
              dropdownId="coupon-product"
              emptyOptionIsPlaceholder
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
          </section>
          {mode === 'LIVE' && (
            <label>
              제목
              <input
                aria-label="제목"
                placeholder="제목을 입력하세요"
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
              aria-label="메시지"
              placeholder="고객에게 전할 내용을 입력하세요"
              maxLength={500}
              value={message}
              disabled={busy}
              onChange={(event) => {
                invalidate();
                setMessage(event.target.value);
              }}
            />
          </label>
          <section aria-label="발송 모드">
            <span>발송 모드</span>
            <Select
              dropdownId="coupon-mode"
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
            <div role="status">
              <StyledCouponBanner
                color="danger"
                LeftIcon={IconAlertTriangle}
                message={[
                  mode === 'SIMULATION'
                    ? '검증 모드 · 실제 전송 및 과금 없음'
                    : capabilities.environment === 'production'
                      ? '실제 발송 · 센드비 캐시 차감'
                      : '센드비 개발 환경 · 테스트 발송',
                  !capabilities.liveAvailable && capabilities.liveBlockedReason,
                ]
                  .filter(Boolean)
                  .join('. ')}
              />
            </div>
          </section>
          {mode === 'SIMULATION' && (
            <section aria-label="검증 상황">
              <span>검증 상황</span>
              <Select
                dropdownId="coupon-scenario"
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
            </section>
          )}
          <section aria-label="발송 한도">
            <StyledCouponSummary>
              <Tag
                color="orange"
                text={`${mode === 'LIVE' ? '발송 한도' : '검증 예산'} ${(mode === 'LIVE' ? capabilities.liveBudget : capabilities.simulationBudget).toLocaleString('ko-KR')}원`}
              />
              <Tag color="blue" Icon={IconUsers} text="최대 1,000명" />
            </StyledCouponSummary>
          </section>
          {sidePanelHeaderActionsElement &&
            createPortal(
              <Button
                title="발송 전 검토"
                size="small"
                variant="primary"
                accent="blue"
                Icon={IconSend}
                onClick={review}
                disabled={
                  isSendingDisabled ||
                  busy ||
                  !productId ||
                  !message.trim() ||
                  (mode === 'LIVE' && !title.trim()) ||
                  (target === 'phone' ? !testPhone.trim() : !listId)
                }
              />,
              sidePanelHeaderActionsElement,
            )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {quote && (
        <StyledCard aria-label="쿠폰 발송 전 검토">
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
              isSendingDisabled ||
              busy ||
              (quote.mode === 'LIVE' && !confirmed) ||
              quote.estimatedCost >
                (quote.mode === 'LIVE'
                  ? (capabilities?.liveBudget ?? 0)
                  : (capabilities?.simulationBudget ?? 0))
            }
          />
        </StyledCard>
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
    </StyledForm>
  );
};
