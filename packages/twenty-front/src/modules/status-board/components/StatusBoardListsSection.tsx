import {
  StyledStatusBoardChip,
  StyledStatusBoardChipRow,
  StyledStatusBoardSection,
  StyledStatusBoardSectionTitle,
  StyledStatusBoardTwoColumn,
} from '@/status-board/components/statusBoardStyled';
import { StatusBoardRecordList } from '@/status-board/components/StatusBoardRecordList';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import {
  buildStatusBoardEndingOnboardingFilter,
  buildStatusBoardMemberFilter,
  buildStatusBoardOpenOpportunityFilter,
  buildStatusBoardOverdueDepositFilter,
} from '@/status-board/utils/buildStatusBoardSectionFilters';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

type StatusBoardListsSectionProps = {
  depositObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  opportunityObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
  selectedGroupIds: string[];
  todayIsoDate: string;
  monthStartDate: string;
  monthEndDate: string;
  onboardingTab: 'ACTIVE' | 'PRE' | 'DONE';
  onOnboardingTabChange: (tab: 'ACTIVE' | 'PRE' | 'DONE') => void;
};

export const StatusBoardListsSection = ({
  depositObjectMetadataItem,
  opportunityObjectMetadataItem,
  onboardingObjectMetadataItem,
  memberIds,
  selectedGroupIds,
  todayIsoDate,
  monthStartDate,
  monthEndDate,
  onboardingTab,
  onOnboardingTabChange,
}: StatusBoardListsSectionProps) => {
  const overdueFilter =
    depositObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardOverdueDepositFilter({
          depositObjectMetadataItem,
          todayIsoDate,
          memberIds,
          selectedGroupIds,
        });
  const endingFilter =
    onboardingObjectMetadataItem === undefined ||
    !hasStatusBoardField(
      onboardingObjectMetadataItem,
      STATUS_BOARD_FIELD.contractEndDate,
    )
      ? undefined
      : buildStatusBoardEndingOnboardingFilter({
          onboardingObjectMetadataItem,
          memberIds,
          monthStartDate,
          monthEndDate,
        });
  const openFilter =
    opportunityObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardOpenOpportunityFilter({
          opportunityObjectMetadataItem,
          memberIds,
        });

  if (
    depositObjectMetadataItem === undefined &&
    opportunityObjectMetadataItem === undefined &&
    onboardingObjectMetadataItem === undefined
  ) {
    return null;
  }

  return (
    <StyledStatusBoardTwoColumn>
      <StyledStatusBoardSection>
        <StyledStatusBoardSectionTitle>확인할 항목</StyledStatusBoardSectionTitle>
        {depositObjectMetadataItem !== undefined &&
          hasStatusBoardField(
            depositObjectMetadataItem,
            STATUS_BOARD_FIELD.expectedPaymentDate,
          ) && (
            <StatusBoardRecordList
              heading="미수금"
              objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit}
              filter={overdueFilter}
              recordGqlFields={buildStatusBoardRecordGqlFields({
                objectMetadataItem: depositObjectMetadataItem,
                fieldNames: [
                  STATUS_BOARD_FIELD.name,
                  STATUS_BOARD_FIELD.company,
                ],
              })}
              emptyLabel="예정일 지난 건 없음"
            />
          )}
        {onboardingObjectMetadataItem !== undefined &&
          endingFilter !== undefined && (
            <StatusBoardRecordList
              heading="이번 달 종료 예정"
              objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding}
              filter={endingFilter}
              recordGqlFields={buildStatusBoardRecordGqlFields({
                objectMetadataItem: onboardingObjectMetadataItem,
                fieldNames: [
                  STATUS_BOARD_FIELD.name,
                  STATUS_BOARD_FIELD.company,
                ],
              })}
              emptyLabel="이번 달 종료 예정 없음"
            />
          )}
        {opportunityObjectMetadataItem !== undefined && (
          <StatusBoardRecordList
            heading="진행 중 문의"
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity}
            filter={openFilter}
            recordGqlFields={buildStatusBoardRecordGqlFields({
              objectMetadataItem: opportunityObjectMetadataItem,
              fieldNames: [STATUS_BOARD_FIELD.name, STATUS_BOARD_FIELD.company],
            })}
            emptyLabel="진행 중 문의 없음"
          />
        )}
      </StyledStatusBoardSection>
      {onboardingObjectMetadataItem !== undefined && (
        <StyledStatusBoardSection>
          <StyledStatusBoardSectionTitle>계약</StyledStatusBoardSectionTitle>
          {hasStatusBoardField(
            onboardingObjectMetadataItem,
            STATUS_BOARD_FIELD.onboardingStatus,
          ) && (
            <StyledStatusBoardChipRow>
              {(['PRE', 'ACTIVE', 'DONE'] as const).map((tab) => (
                <StyledStatusBoardChip
                  key={tab}
                  type="button"
                  isActive={onboardingTab === tab}
                  onClick={() => onOnboardingTabChange(tab)}
                >
                  {tab === 'PRE'
                    ? '시작 전'
                    : tab === 'ACTIVE'
                      ? '온보딩 중'
                      : '완료'}
                </StyledStatusBoardChip>
              ))}
            </StyledStatusBoardChipRow>
          )}
          <StatusBoardRecordList
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding}
            filter={andStatusBoardFilters([
              hasStatusBoardField(
                onboardingObjectMetadataItem,
                STATUS_BOARD_FIELD.onboardingStatus,
              )
                ? {
                    [STATUS_BOARD_FIELD.onboardingStatus]: {
                      eq: onboardingTab,
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
            ])}
            recordGqlFields={buildStatusBoardRecordGqlFields({
              objectMetadataItem: onboardingObjectMetadataItem,
              fieldNames: [STATUS_BOARD_FIELD.name, STATUS_BOARD_FIELD.company],
            })}
            emptyLabel="계약 없음"
          />
        </StyledStatusBoardSection>
      )}
    </StyledStatusBoardTwoColumn>
  );
};
