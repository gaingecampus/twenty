import { styled } from '@linaria/react';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';
import { useStatusBoardCount } from '@/status-board/hooks/useStatusBoardCount';
import { buildStatusBoardIdInFilter } from '@/status-board/utils/buildStatusBoardIdInFilter';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import {
  buildStatusBoardActiveOnboardingFilter,
  buildStatusBoardOpenOpportunityFilter,
} from '@/status-board/utils/buildStatusBoardSectionFilters';
import { SelectDisplay } from '@/ui/field/display/components/SelectDisplay';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

const StyledActivity = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
`;

const ActivityLabel = ({
  objectMetadataItem,
  companyId,
  activeFilter,
  label,
  color,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  companyId: string;
  activeFilter?: RecordGqlOperationFilter;
  label: string;
  color: 'blue' | 'green';
}) => {
  const companyFilter = buildStatusBoardIdInFilter({
    objectMetadataItem,
    fieldNames: ['company', 'companyId'],
    ids: [companyId],
  });
  const { count, loading, error } = useStatusBoardCount({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter: andStatusBoardFilters([companyFilter, activeFilter]),
    skip: companyFilter === undefined || activeFilter === undefined,
  });

  if (!companyFilter || !activeFilter || loading || error || count === 0)
    return null;

  return (
    <SelectDisplay
      color={color}
      label={`${label} ${count.toLocaleString('ko-KR')}건`}
    />
  );
};

export const StatusBoardCompanyActivity = ({
  companyId,
}: {
  companyId: string;
}) => {
  const { opportunity, onboarding } = useStatusBoardMetadata();
  return (
    <StyledActivity>
      {opportunity && hasStatusBoardField(opportunity, 'customStage') && (
        <ActivityLabel
          objectMetadataItem={opportunity}
          companyId={companyId}
          activeFilter={buildStatusBoardOpenOpportunityFilter({
            opportunityObjectMetadataItem: opportunity,
            memberIds: undefined,
          })}
          label="문의 진행 중"
          color="blue"
        />
      )}
      {onboarding && hasStatusBoardField(onboarding, 'onboardingStatus') && (
        <ActivityLabel
          objectMetadataItem={onboarding}
          companyId={companyId}
          activeFilter={buildStatusBoardActiveOnboardingFilter({
            onboardingObjectMetadataItem: onboarding,
            memberIds: undefined,
          })}
          label="계약 진행 중"
          color="green"
        />
      )}
    </StyledActivity>
  );
};
