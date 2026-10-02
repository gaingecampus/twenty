import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { DashboardKpiCard } from '@/ui/layout/dashboard/components/DashboardKpiCard';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { useStatusBoardOnboardingMetrics } from '@/status-board/hooks/useStatusBoardOnboardingMetrics';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { formatStatusBoardCount } from '@/status-board/utils/formatStatusBoardCount';

export const StatusBoardOnboardingKpi = ({
  objectMetadataItem,
  memberIds,
  onOpenSheet,
  variant = 'company',
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  memberIds?: string[];
  variant?: 'company' | 'project';
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
}) => {
  const {
    companyMetrics: companies,
    projectMetrics,
    loading,
    error,
  } = useStatusBoardOnboardingMetrics({
    objectMetadataItem,
    memberIds,
  });
  const companyMetrics = variant === 'project' ? projectMetrics : companies;
  const label = variant === 'project' ? '온보딩 프로젝트 수' : '온보딩 기업 수';
  const companyCount = companyMetrics.totalCount;
  const companyOnboardingIds = Object.keys(
    companyMetrics.personCountByOnboardingId,
  );
  const memberObjectNameSingular = objectMetadataItem.readableFields.find(
    (field) => field.name === 'executionConsultant',
  )?.relation?.targetObjectMetadata.nameSingular;
  const recordGqlFields = buildStatusBoardRecordGqlFields({
    objectMetadataItem,
    fieldNames: ['name', 'company'],
  });
  return (
    <DashboardKpiCard
      label={label}
      value={error ? '—' : formatStatusBoardCount(companyCount)}
      exactValue={error ? undefined : `${companyCount}건`}
      subtitle={error ? '불러오지 못했어요' : undefined}
      description={
        variant === 'project'
          ? '컨설팅·코칭 외 계약의 리드·실행·공동 인원 합계'
          : '컨설팅·코칭 계약의 리드·실행·공동 인원 합계'
      }
      loading={loading}
      tone={error || companyCount === 0 ? 'default' : 'green'}
      isEmpty={!loading && !error && companyCount === 0}
      onClick={
        loading || error
          ? undefined
          : () =>
              onOpenSheet({
                title: label,
                kpiLabel: label,
                tone: 'green',
                objectNameSingular: objectMetadataItem.nameSingular,
                filter: companyOnboardingIds.length
                  ? { id: { in: companyOnboardingIds } }
                  : { id: { is: 'NULL' } },
                recordGqlFields,
                recordBadges: Object.fromEntries(
                  Object.entries(companyMetrics.personCountByOnboardingId).map(
                    ([id, personCount]) => [id, `${personCount}명`],
                  ),
                ),
                recordMembers:
                  memberObjectNameSingular === undefined
                    ? undefined
                    : {
                        objectNameSingular: memberObjectNameSingular,
                        memberIdsByRecordId:
                          companyMetrics.memberIdsByOnboardingId,
                      },
                summary: `합계 ${companyCount}건`,
                listTarget: { objectMetadataItem },
              })
      }
    />
  );
};
