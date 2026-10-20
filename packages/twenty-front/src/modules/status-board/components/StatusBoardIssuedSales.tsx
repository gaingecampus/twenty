import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { StatusBoardDepositShare } from '@/status-board/components/StatusBoardDepositShare';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardPeriodDepositFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { StyledDashboardMuted } from '@/ui/layout/dashboard/components/dashboardStyled';

export type StatusBoardIssuedSalesProps = {
  depositObjectMetadataItem?: EnrichedObjectMetadataItem;
  memberIds?: string[];
  selectedGroupIds: string[];
  isGroupUnavailable: boolean;
};

export const StatusBoardIssuedSales = ({
  month,
  gaingeAmount,
  gaingeLoading,
  depositObjectMetadataItem,
  memberIds,
  selectedGroupIds,
  isGroupUnavailable,
}: StatusBoardIssuedSalesProps & {
  month: string;
  gaingeAmount?: number | null;
  gaingeLoading?: boolean;
}) => {
  if (isGroupUnavailable) {
    return (
      <StyledDashboardMuted role="status">
        선택한 그룹의 소속 정보를 확인할 수 없습니다. 전체 그룹으로 조회해
        주세요.
      </StyledDashboardMuted>
    );
  }
  if (
    !depositObjectMetadataItem ||
    !hasStatusBoardField(
      depositObjectMetadataItem,
      STATUS_BOARD_FIELD.amount,
    ) ||
    !hasStatusBoardField(
      depositObjectMetadataItem,
      STATUS_BOARD_FIELD.depositStatus,
    )
  ) {
    return (
      <StyledDashboardMuted role="status">
        입금 매출을 조회할 수 없습니다. 입금 객체와 조회 권한을 확인해 주세요.
      </StyledDashboardMuted>
    );
  }
  const [year, monthNumber] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(Date.UTC(year, monthNumber, 0))
    .toISOString()
    .slice(0, 10);
  const issuedFilter = buildStatusBoardPeriodDepositFilter({
    depositObjectMetadataItem,
    memberIds,
    selectedGroupIds,
    startDate,
    endDate,
    dateField: STATUS_BOARD_FIELD.issueDate,
  });
  const dateBasis = hasStatusBoardField(
    depositObjectMetadataItem,
    STATUS_BOARD_FIELD.issueDate,
  )
    ? '발행일'
    : '등록일';
  return (
    <>
      <StatusBoardDepositShare
        paidFilter={andStatusBoardFilters([
          issuedFilter,
          { depositStatus: { eq: 'PAID' } },
        ])}
        dueFilter={andStatusBoardFilters([
          issuedFilter,
          { depositStatus: { neq: 'PAID' } },
        ])}
        dateBasis={dateBasis}
        gaingeAmount={gaingeAmount}
        gaingeLoading={gaingeLoading}
      />
      <StyledDashboardMuted>
        집계 기간 {startDate} ~ {endDate} · {dateBasis} 기준 · 상단 그룹·구성원
        필터 적용
      </StyledDashboardMuted>
    </>
  );
};
