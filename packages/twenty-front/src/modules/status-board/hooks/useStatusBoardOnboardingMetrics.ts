import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getJunctionConfig } from '@/object-record/record-field/ui/utils/junction/getJunctionConfig';
import { getRelationJoinColumnName } from '@/object-record/record-field/ui/utils/junction/getRelationJoinColumnName';
import { useStatusBoardAllRecords } from '@/status-board/hooks/useStatusBoardAllRecords';
import { buildStatusBoardActiveOnboardingFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import {
  getStatusBoardOnboardingMetrics,
  getStatusBoardRelationId,
} from '@/status-board/utils/getStatusBoardOnboardingMetrics';
import { FieldMetadataType } from 'twenty-shared/types';

export const useStatusBoardOnboardingMetrics = ({
  objectMetadataItem,
  memberIds,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  memberIds?: string[];
}) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const executionField = objectMetadataItem.readableFields.find(
    (field) => field.name === 'executionConsultant',
  );
  const executionIdField = executionField
    ? (getRelationJoinColumnName(executionField) ?? 'executionConsultantId')
    : 'executionConsultantId';
  const hasExecutionId =
    executionField?.type === FieldMetadataType.RELATION ||
    objectMetadataItem.readableFields.some(
      (field) => field.name === executionIdField,
    );
  const coField = objectMetadataItem.readableFields.find(
    (field) => field.name === 'gongdongSilhaengKeonseolteonteu',
  );
  const junction = coField
    ? getJunctionConfig({
        settings: coField.settings,
        relationObjectMetadataId:
          coField.relation?.targetObjectMetadata.id ?? '',
        sourceObjectMetadataId: objectMetadataItem.id,
        objectMetadataItems,
      })
    : null;
  const { canReadObjectRecords: canReadAssignments } =
    useObjectPermissionsForObject(
      junction?.junctionObjectMetadata.id ?? objectMetadataItem.id,
    );
  const sourceKey = junction?.sourceField
    ? getRelationJoinColumnName(junction.sourceField)
    : undefined;
  const targetKey = junction?.targetFields[0]
    ? getRelationJoinColumnName(junction.targetFields[0])
    : undefined;
  const contracts = useStatusBoardAllRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter: buildStatusBoardActiveOnboardingFilter({
      onboardingObjectMetadataItem: objectMetadataItem,
      memberIds: undefined,
    }),
    limit: 200,
    recordGqlFields: {
      id: true,
      ...(hasExecutionId ? { [executionIdField]: true } : {}),
      ...(objectMetadataItem.readableFields.some(
        (field) => field.name === 'company',
      )
        ? { company: { id: true } }
        : {}),
    },
  });
  const links = useStatusBoardAllRecords({
    objectNameSingular:
      junction?.junctionObjectMetadata.nameSingular ??
      objectMetadataItem.nameSingular,
    skip: !sourceKey || !targetKey || !canReadAssignments,
    limit: 200,
    recordGqlFields: {
      id: true,
      ...(sourceKey ? { [sourceKey]: true } : {}),
      ...(targetKey ? { [targetKey]: true } : {}),
    },
  });
  const assignments =
    sourceKey && targetKey
      ? links.records.flatMap((record) => {
          const onboardingId = getStatusBoardRelationId(record[sourceKey]);
          const memberId = getStatusBoardRelationId(record[targetKey]);
          return onboardingId && memberId ? [{ onboardingId, memberId }] : [];
        })
      : [];
  const metrics = getStatusBoardOnboardingMetrics({
    records: contracts.records,
    assignments,
    memberIds,
    executionIdField,
  });
  const configurationError =
    coField && (!sourceKey || !targetKey || !canReadAssignments)
      ? new Error('공동 실행 컨설턴트 관계를 확인할 수 없습니다')
      : undefined;
  return {
    ...metrics,
    assignments,
    loading: contracts.loading || links.loading,
    error: contracts.error ?? links.error ?? configurationError,
  };
};
