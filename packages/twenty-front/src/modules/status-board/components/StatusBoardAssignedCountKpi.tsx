import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { getJunctionConfig } from '@/object-record/record-field/ui/utils/junction/getJunctionConfig';
import { getRelationJoinColumnName } from '@/object-record/record-field/ui/utils/junction/getRelationJoinColumnName';
import { StatusBoardLinkedCountKpi } from '@/status-board/components/StatusBoardLinkedCountKpi';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { useStatusBoardAllRecords } from '@/status-board/hooks/useStatusBoardAllRecords';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardMemberFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { buildStatusBoardSharedMemberFilter } from '@/status-board/utils/buildStatusBoardSharedMemberFilter';
import { getStatusBoardRelationId } from '@/status-board/utils/getStatusBoardOnboardingMetrics';
import { DashboardKpiCard } from '@/ui/layout/dashboard/components/DashboardKpiCard';
import { type DashboardTone } from '@/ui/layout/dashboard/components/dashboardStyled';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const StatusBoardAssignedCountKpi = ({
  objectMetadataItem,
  memberIds,
  memberFieldNames,
  sharedFieldName,
  filter,
  label,
  tone,
  onOpenSheet,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  memberIds?: string[];
  memberFieldNames: string[];
  sharedFieldName: string;
  filter?: RecordGqlOperationFilter;
  label: string;
  tone: DashboardTone;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
}) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const sharedField = objectMetadataItem.readableFields.find(
    (field) => field.name === sharedFieldName,
  );
  const junction = sharedField
    ? getJunctionConfig({
        settings: sharedField.settings,
        relationObjectMetadataId:
          sharedField.relation?.targetObjectMetadata.id ?? '',
        sourceObjectMetadataId: objectMetadataItem.id,
        objectMetadataItems,
      })
    : null;
  const sourceKey = junction?.sourceField
    ? getRelationJoinColumnName(junction.sourceField)
    : undefined;
  const targetKey = junction?.targetFields[0]
    ? getRelationJoinColumnName(junction.targetFields[0])
    : undefined;
  const { canReadObjectRecords } = useObjectPermissionsForObject(
    junction?.junctionObjectMetadata.id ?? objectMetadataItem.id,
  );
  const needsShared =
    memberIds !== undefined && memberIds.length > 0 && !!sharedField;
  const configurationError =
    needsShared && (!sourceKey || !targetKey || !canReadObjectRecords);
  const links = useStatusBoardAllRecords({
    objectNameSingular:
      junction?.junctionObjectMetadata.nameSingular ??
      objectMetadataItem.nameSingular,
    skip: !needsShared || !!configurationError,
    filter: targetKey ? { [targetKey]: { in: memberIds ?? [] } } : undefined,
    limit: 200,
    recordGqlFields: { id: true, ...(sourceKey ? { [sourceKey]: true } : {}) },
  });
  if (needsShared && (links.loading || links.error || configurationError)) {
    return (
      <DashboardKpiCard
        label={label}
        value="—"
        loading={links.loading}
        subtitle={
          links.error || configurationError ? '불러오지 못했어요' : undefined
        }
      />
    );
  }
  const memberFilter = buildStatusBoardSharedMemberFilter({
    memberIds,
    directFilter: buildStatusBoardMemberFilter({
      objectMetadataItem,
      fieldNames: memberFieldNames,
      memberIds,
    }),
    sharedRecordIds: sourceKey
      ? links.records.flatMap((record) => {
          const id = getStatusBoardRelationId(record[sourceKey]);
          return id ? [id] : [];
        })
      : [],
  });
  return (
    <StatusBoardLinkedCountKpi
      objectMetadataItem={objectMetadataItem}
      filter={andStatusBoardFilters([filter, memberFilter])}
      label={label}
      tone={tone}
      recordMembers={(() => {
        const memberObject =
          junction?.targetFields[0]?.relation?.targetObjectMetadata ??
          objectMetadataItem.readableFields.find(
            (field) =>
              memberFieldNames.includes(field.name) && field.relation != null,
          )?.relation?.targetObjectMetadata;
        if (!memberObject) return undefined;
        const memberMetadata = objectMetadataItems.find(
          (item) => item.id === memberObject.id,
        );
        if (!memberMetadata) return undefined;
        return {
          objectNameSingular: memberMetadata.nameSingular,
          directFieldNames: memberFieldNames,
          sharedRelation:
            sourceKey && targetKey && canReadObjectRecords && junction
              ? {
                  objectNameSingular:
                    junction.junctionObjectMetadata.nameSingular,
                  sourceKey,
                  targetKey,
                }
              : undefined,
        };
      })()}
      onOpenSheet={onOpenSheet}
    />
  );
};
