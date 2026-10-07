import { parseFieldSummarySections } from './parseFieldSummarySections';
import { useEffect, useState } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { IconChevronDown } from 'twenty-ui/icon';
import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import {
  FIELD_SUMMARY_CHANGED,
  requestFieldSummary,
  type FieldSummaryResult,
} from './fieldSummaryRequest';

const StyledSummary = styled.details`
  border-top: 1px solid ${theme.border.color.light};
  color: ${theme.font.color.primary};
  font-size: ${theme.font.size.md};
  line-height: 1.7;
  margin-top: ${theme.spacing[4]};
  padding-top: ${theme.spacing[3]};
  text-align: left;

  [data-contract-detail] > & {
    margin-top: 0;
  }

  > summary {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: ${theme.spacing[2]};
    list-style: none;
  }
  > summary::-webkit-details-marker {
    display: none;
  }
  > summary:hover {
    color: ${theme.color.blue};
  }
  > summary > svg {
    margin-left: auto;
    flex-shrink: 0;
  }
  &[open] > summary > svg {
    transform: rotate(180deg);
  }
  [data-summary-meta] {
    color: ${theme.font.color.tertiary};
    font-size: ${theme.font.size.sm};
    font-weight: ${theme.font.weight.regular};
  }
  && [data-summary-content] {
    margin: ${theme.spacing[3]} 0 0;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing[4]};
  }
  && [data-summary-content] h4 {
    font-size: ${theme.font.size.md};
    margin: 0 0 ${theme.spacing[1]};
  }
  && [data-summary-content] p {
    color: ${theme.font.color.secondary};
    margin: 0;
    white-space: pre-line;
  }
  && [data-summary-state] {
    align-items: center;
    background: ${theme.background.secondary};
    border-radius: ${theme.border.radius.sm};
    color: ${theme.font.color.secondary};
    display: flex;
    flex-wrap: wrap;
    font-size: ${theme.font.size.sm};
    gap: ${theme.spacing[2]};
    justify-content: space-between;
    margin: ${theme.spacing[3]} 0 0;
    padding: ${theme.spacing[3]};
  }
  && [data-summary-state] button {
    background: transparent;
    border: 1px solid ${theme.border.color.medium};
    border-radius: ${theme.border.radius.sm};
    color: ${theme.font.color.primary};
    cursor: pointer;
    flex-shrink: 0;
    font: inherit;
    padding: ${theme.spacing[1]} ${theme.spacing[2]};
  }
  && [data-summary-state] button:hover {
    background: ${theme.background.tertiary};
    color: ${theme.color.blue};
  }
  && [data-summary-loading] {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing[3]};
    margin-top: ${theme.spacing[3]};
  }
  && [data-summary-loading] > span {
    color: ${theme.font.color.tertiary};
    font-size: ${theme.font.size.sm};
  }
  @media (prefers-reduced-motion: reduce) {
    [data-summary-loading] .react-loading-skeleton::after {
      animation: none;
    }
  }
`;

export const FieldContractSummary = ({
  contract,
  visits,
}: {
  contract: ObjectRecord;
  visits: ObjectRecord[];
}) => {
  const [openedContractId, setOpenedContractId] = useState<string>();
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<FieldSummaryResult>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const revision = JSON.stringify([
    contract.consultingGoal,
    contract.successCriteria,
    contract.plannedSessionCount,
    visits.map(({ id, updatedAt }) => [id, updatedAt]),
  ]);
  const hasSource = !!(
    contract.consultingGoal ||
    contract.successCriteria ||
    visits.length
  );
  useEffect(() => {
    const changed = (event: Event) => {
      if ((event as CustomEvent<string>).detail === contract.id)
        setRetry((value) => value + 1);
    };
    window.addEventListener(FIELD_SUMMARY_CHANGED, changed);
    return () => window.removeEventListener(FIELD_SUMMARY_CHANGED, changed);
  }, [contract.id]);
  useEffect(() => {
    if (!hasSource || openedContractId !== contract.id) return;
    let current = true;
    setStatus('loading');
    setResult(undefined);
    void requestFieldSummary(contract.id)
      .then((summary) => {
        if (current) {
          setResult(summary);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (current) setStatus('error');
      });
    return () => {
      current = false;
    };
  }, [contract.id, revision, retry, hasSource, openedContractId]);
  if (!hasSource) return null;
  return (
    <StyledSummary
      key={contract.id}
      aria-label="계약 기록 요약"
      aria-busy={openedContractId === contract.id && status === 'loading'}
      onToggle={(event) => {
        if (event.currentTarget.open) setOpenedContractId(contract.id);
      }}
    >
      <summary>
        <strong>진행 요약</strong>
        <span data-summary-meta>
          AI 요약{result ? ` · 기록 ${result.recordCount}건` : ''}
        </span>
        <IconChevronDown size={16} aria-hidden="true" />
      </summary>
      {status === 'loading' ? (
        <div data-summary-loading role="status">
          <span>기록을 정리하고 있어요</span>
          <div aria-hidden="true">
            <SkeletonTheme
              baseColor={theme.background.tertiary}
              highlightColor={theme.background.secondary}
              borderRadius={4}
            >
              <Skeleton width="24%" height={12} />
              <Skeleton count={2} height={10} />
              <Skeleton width="68%" height={10} />
            </SkeletonTheme>
          </div>
        </div>
      ) : status === 'error' ? (
        <p data-summary-state role="status">
          <span>요약을 불러오지 못했습니다.</span>{' '}
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            다시 시도
          </button>
        </p>
      ) : (
        <div data-summary-content>
          {parseFieldSummarySections(result?.text ?? '').map(
            (section, index) => (
              <div key={index}>
                {section.title && <h4>{section.title}</h4>}
                <p>{section.body}</p>
              </div>
            ),
          )}
        </div>
      )}
    </StyledSummary>
  );
};
