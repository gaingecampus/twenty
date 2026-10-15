import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { useStatusBoardOnboardingMetrics } from '@/status-board/hooks/useStatusBoardOnboardingMetrics';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { formatStatusBoardCount } from '@/status-board/utils/formatStatusBoardCount';
import { DashboardKpiCard } from '@/ui/layout/dashboard/components/DashboardKpiCard';

type StatusBoardUpcomingOnboardingKpiProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  memberIds?: string[];
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
};

export const StatusBoardUpcomingOnboardingKpi = ({
  objectMetadataItem,
  memberIds,
  onOpenSheet,
}: StatusBoardUpcomingOnboardingKpiProps) => {
  const { scopedContractIds, loading, error } = useStatusBoardOnboardingMetrics(
    {
      objectMetadataItem,
      memberIds,
      status: 'PRE',
    },
  );
  const count = scopedContractIds.length;
  return (
    <DashboardKpiCard
      label="온보딩 예정"
      description="온보딩 전 상태인 계약 수입니다. 다음 달 이후 예정과 시작일 미정 계약도 포함합니다."
      value={error ? '—' : formatStatusBoardCount(count)}
      exactValue={error ? undefined : `${count}건`}
      subtitle={error ? '불러오지 못했어요' : '시작 전 계약'}
      loading={loading}
      tone={error || count === 0 ? 'default' : 'blue'}
      isEmpty={!loading && !error && count === 0}
      onClick={
        loading || error
          ? undefined
          : () =>
              onOpenSheet({
                title: '온보딩 예정',
                kpiLabel: '온보딩 예정',
                tone: 'blue',
                objectNameSingular: objectMetadataItem.nameSingular,
                filter: scopedContractIds.length
                  ? { id: { in: scopedContractIds } }
                  : { id: { is: 'NULL' } },
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem,
                  fieldNames: [
                    'name',
                    'company',
                    'contractStartDate',
                    'contractEndDate',
                  ],
                }),
                listTarget: { objectMetadataItem },
              })
      }
    />
  );
};
