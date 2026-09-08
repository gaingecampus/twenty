import { useStatusBoardCount } from '@/status-board/hooks/useStatusBoardCount';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import {
  StyledStatusBoardContractSection,
  StyledStatusBoardSectionTitle,
  StyledStatusBoardSoftTab,
  StyledStatusBoardTabCount,
  StyledStatusBoardContractTabs,
  StyledStatusBoardContractBody,
} from '@/status-board/components/statusBoardStyled';
import { StatusBoardRecordList } from '@/status-board/components/StatusBoardRecordList';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { buildStatusBoardMemberFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

type StatusBoardListsSectionProps = {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
  onboardingTab: 'ACTIVE' | 'PRE' | 'DONE';
  onOnboardingTabChange: (tab: 'ACTIVE' | 'PRE' | 'DONE') => void;
};

const StatusBoardContractTab = ({
  label,
  filter,
  isActive,
  onClick,
}: {
  label: string;
  filter?: RecordGqlOperationFilter;
  isActive: boolean;
  onClick: () => void;
}) => {
  const { count, loading, error } = useStatusBoardCount({
    objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
    filter,
  });
  return (
    <StyledStatusBoardSoftTab
      type="button"
      isActive={isActive}
      aria-pressed={isActive}
      aria-busy={loading}
      onClick={onClick}
    >
      {label}
      <StyledStatusBoardTabCount
        title={error ? '건수를 불러오지 못했어요' : undefined}
      >
        {loading ? '…' : error ? '—' : `${count.toLocaleString('ko-KR')}건`}
      </StyledStatusBoardTabCount>
    </StyledStatusBoardSoftTab>
  );
};

export const StatusBoardListsSection = ({
  onboardingObjectMetadataItem,
  memberIds,
  onboardingTab,
  onOnboardingTabChange,
}: StatusBoardListsSectionProps) => {
  if (onboardingObjectMetadataItem === undefined) return null;

  const getContractFilter = (
    tab: StatusBoardListsSectionProps['onboardingTab'],
  ) =>
    andStatusBoardFilters([
      hasStatusBoardField(
        onboardingObjectMetadataItem,
        STATUS_BOARD_FIELD.onboardingStatus,
      )
        ? {
            [STATUS_BOARD_FIELD.onboardingStatus]: {
              eq: tab,
            },
          }
        : undefined,
      buildStatusBoardMemberFilter({
        objectMetadataItem: onboardingObjectMetadataItem,
        fieldNames: [
          STATUS_BOARD_FIELD.leadConsultant,
          STATUS_BOARD_FIELD.leadConsultantId,
          STATUS_BOARD_FIELD.executionConsultant,
          STATUS_BOARD_FIELD.executionConsultantId,
        ],
        memberIds,
      }),
    ]);

  return (
    <StyledStatusBoardContractSection>
      <StyledStatusBoardSectionTitle>계약</StyledStatusBoardSectionTitle>
      {hasStatusBoardField(
        onboardingObjectMetadataItem,
        STATUS_BOARD_FIELD.onboardingStatus,
      ) && (
        <StyledStatusBoardContractTabs>
          {(['PRE', 'ACTIVE', 'DONE'] as const).map((tab) => (
            <StatusBoardContractTab
              key={tab}
              isActive={onboardingTab === tab}
              filter={getContractFilter(tab)}
              onClick={() => onOnboardingTabChange(tab)}
              label={
                tab === 'PRE'
                  ? '시작 전'
                  : tab === 'ACTIVE'
                    ? '온보딩 중'
                    : '완료'
              }
            />
          ))}
        </StyledStatusBoardContractTabs>
      )}
      <StyledStatusBoardContractBody>
        <StatusBoardRecordList
          objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding}
          filter={getContractFilter(onboardingTab)}
          tone="green"
          recordGqlFields={buildStatusBoardRecordGqlFields({
            objectMetadataItem: onboardingObjectMetadataItem,
            fieldNames: [
              STATUS_BOARD_FIELD.name,
              STATUS_BOARD_FIELD.company,
              STATUS_BOARD_FIELD.customStage,
              STATUS_BOARD_FIELD.contractStartDate,
              STATUS_BOARD_FIELD.contractEndDate,
              STATUS_BOARD_FIELD.onboardingStatus,
              STATUS_BOARD_FIELD.visitDays,
              STATUS_BOARD_FIELD.visitCadence,
              'totalFee',
            ],
          })}
          emptyLabel={
            onboardingTab === 'PRE'
              ? '시작 전인 계약이 없어요'
              : onboardingTab === 'ACTIVE'
                ? '온보딩 중인 계약이 없어요'
                : '완료된 계약이 없어요'
          }
        />
      </StyledStatusBoardContractBody>
    </StyledStatusBoardContractSection>
  );
};
