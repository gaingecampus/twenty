import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { useStatusBoardSum } from '@/status-board/hooks/useStatusBoardSum';
import { formatStatusBoardAmount } from '@/status-board/utils/formatStatusBoardAmount';

const StyledShare = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 84px;
  padding: 16px 16px 0;
`;
const StyledHeader = styled.div`
  align-items: baseline;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  font-size: 13px;
  gap: 6px 16px;
  justify-content: space-between;
`;
const StyledTrack = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: 6px;
  display: flex;
  height: 12px;
  overflow: hidden;
`;
const StyledFill = styled.div<{ share: number; paid: boolean }>`
  background: ${({ paid }) =>
    paid ? themeCssVariables.color.green : themeCssVariables.color.orange};
  height: 100%;
  width: ${({ share }) => `${share}%`};
`;
const StyledLegend = styled.span<{ paid: boolean }>`
  align-items: center;
  display: inline-flex;
  gap: 6px;
  &::before {
    background: ${({ paid }) =>
      paid ? themeCssVariables.color.green : themeCssVariables.color.orange};
    border-radius: 2px;
    content: '';
    height: 8px;
    width: 8px;
  }
`;

export const StatusBoardDepositShare = ({
  paidFilter,
  dueFilter,
  dateBasis,
}: {
  paidFilter?: RecordGqlOperationFilter;
  dueFilter?: RecordGqlOperationFilter;
  dateBasis: string;
}) => {
  const paid = useStatusBoardSum({
    objectNameSingular: 'deposit',
    filter: paidFilter,
  });
  const due = useStatusBoardSum({
    objectNameSingular: 'deposit',
    filter: dueFilter,
  });
  const loading = paid.loading || due.loading;
  const paidAmount = paid.sum ?? 0;
  const dueAmount = due.sum ?? 0;
  const total = paidAmount + dueAmount;
  const invalid = !Number.isFinite(total) || paidAmount < 0 || dueAmount < 0;
  const error = Boolean(paid.error || due.error);
  const hasShare = !loading && !error && !invalid && total > 0;
  const share = hasShare ? (paidAmount / total) * 100 : 0;
  const paidPercent = Math.round(share * 10) / 10;
  const duePercent = Math.round((100 - paidPercent) * 10) / 10;
  const message = loading
    ? '입금 비중을 불러오는 중이에요'
    : error
      ? '입금 비중을 불러오지 못했어요'
      : invalid
        ? '금액을 확인해야 비중을 표시할 수 있어요'
        : '선택한 기간에 집계된 입금 금액이 없어요';
  return (
    <StyledShare aria-busy={loading}>
      <StyledHeader>
        <strong>입금 금액 비중</strong>
        <span>{dateBasis} 기준</span>
      </StyledHeader>
      <StyledTrack
        role="img"
        aria-label={
          hasShare
            ? `입금 완료 ${paidPercent}%, 입금 예정 ${duePercent}%`
            : message
        }
      >
        {hasShare && (
          <>
            <StyledFill paid share={share} />
            <StyledFill paid={false} share={100 - share} />
          </>
        )}
      </StyledTrack>
      <StyledHeader>
        {hasShare ? (
          <>
            <StyledLegend paid>
              입금 완료 {paidPercent}% · {formatStatusBoardAmount(paidAmount)}
            </StyledLegend>
            <StyledLegend paid={false}>
              입금 예정 {duePercent}% · {formatStatusBoardAmount(dueAmount)}
            </StyledLegend>
          </>
        ) : (
          <span>{message}</span>
        )}
      </StyledHeader>
    </StyledShare>
  );
};
