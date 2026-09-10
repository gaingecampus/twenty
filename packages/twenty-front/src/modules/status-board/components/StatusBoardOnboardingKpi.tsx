import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { StatusBoardKpiCard } from '@/status-board/components/StatusBoardKpiCard';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { useStatusBoardOnboardingMetrics } from '@/status-board/hooks/useStatusBoardOnboardingMetrics';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { formatStatusBoardCount } from '@/status-board/utils/formatStatusBoardCount';

export const StatusBoardOnboardingKpi = ({
  objectMetadataItem,
  memberIds,
  onOpenSheet,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  memberIds?: string[];
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
}) => {
  const { consultantCount, onboardingIds, loading, error } =
    useStatusBoardOnboardingMetrics({ objectMetadataItem, memberIds });
  return (
    <StatusBoardKpiCard
      label="온보딩 중"
      value={error ? '—' : formatStatusBoardCount(consultantCount)}
      exactValue={error ? undefined : `${consultantCount}건`}
      subtitle={error ? '불러오지 못했어요' : '계약별 실행·공동 실행 인원 합계'}
      loading={loading}
      tone={error || consultantCount === 0 ? 'default' : 'green'}
      isEmpty={!loading && !error && consultantCount === 0}
      onClick={
        loading || error
          ? undefined
          : () =>
              onOpenSheet({
                title: `온보딩 중 · ${consultantCount}건 배정의 계약`,
                kpiLabel: '온보딩 중',
                tone: 'green',
                objectNameSingular: objectMetadataItem.nameSingular,
                filter: onboardingIds.length
                  ? { id: { in: onboardingIds } }
                  : { id: { is: 'NULL' } },
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem,
                  fieldNames: ['name', 'company'],
                }),
                listTarget: { objectMetadataItem },
              })
      }
    />
  );
};
