import { StatusBoardCountKpi } from '@/status-board/components/StatusBoardCountKpi';
import {
  StyledStatusBoardCumulativeGrid,
  StyledStatusBoardMuted,
  StyledStatusBoardSection,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
} from '@/status-board/components/statusBoardStyled';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { buildStatusBoardMemberFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

type StatusBoardCumulativeSectionProps = {
  companyObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  personObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  opportunityObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  depositObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
};

export const StatusBoardCumulativeSection = ({
  companyObjectMetadataItem,
  personObjectMetadataItem,
  opportunityObjectMetadataItem,
  onboardingObjectMetadataItem,
  depositObjectMetadataItem,
  memberIds,
  onOpenSheet,
}: StatusBoardCumulativeSectionProps) => {
  if (
    companyObjectMetadataItem === undefined &&
    personObjectMetadataItem === undefined &&
    opportunityObjectMetadataItem === undefined &&
    onboardingObjectMetadataItem === undefined &&
    depositObjectMetadataItem === undefined
  ) {
    return null;
  }

  return (
    <StyledStatusBoardSection>
      <StyledStatusBoardSectionHeader>
        <StyledStatusBoardSectionTitle>누적 담당</StyledStatusBoardSectionTitle>
        <StyledStatusBoardMuted>전체 기간</StyledStatusBoardMuted>
      </StyledStatusBoardSectionHeader>
      <StyledStatusBoardCumulativeGrid>
        {companyObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.company}
            filter={buildStatusBoardMemberFilter({
              objectMetadataItem: companyObjectMetadataItem,
              fieldNames: [
                STATUS_BOARD_FIELD.driMember,
                STATUS_BOARD_FIELD.driMemberId,
              ],
              memberIds,
            })}
            label="기업"
            onClick={() =>
              onOpenSheet({
                title: '누적 기업',
                objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.company,
                filter: buildStatusBoardMemberFilter({
                  objectMetadataItem: companyObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.driMember,
                    STATUS_BOARD_FIELD.driMemberId,
                  ],
                  memberIds,
                }),
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: companyObjectMetadataItem,
                  fieldNames: [STATUS_BOARD_FIELD.name],
                }),
              })
            }
          />
        )}
        {personObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.person}
            filter={buildStatusBoardMemberFilter({
              objectMetadataItem: personObjectMetadataItem,
              fieldNames: [
                STATUS_BOARD_FIELD.driMember,
                STATUS_BOARD_FIELD.driMemberId,
              ],
              memberIds,
            })}
            label="고객"
            onClick={() =>
              onOpenSheet({
                title: '누적 고객',
                objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.person,
                filter: buildStatusBoardMemberFilter({
                  objectMetadataItem: personObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.driMember,
                    STATUS_BOARD_FIELD.driMemberId,
                  ],
                  memberIds,
                }),
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: personObjectMetadataItem,
                  fieldNames: [STATUS_BOARD_FIELD.name],
                }),
              })
            }
          />
        )}
        {opportunityObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity}
            filter={buildStatusBoardMemberFilter({
              objectMetadataItem: opportunityObjectMetadataItem,
              fieldNames: [
                STATUS_BOARD_FIELD.assignee,
                STATUS_BOARD_FIELD.assigneeId,
              ],
              memberIds,
            })}
            label="문의"
            onClick={() =>
              onOpenSheet({
                title: '누적 문의',
                objectNameSingular:
                  STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity,
                filter: buildStatusBoardMemberFilter({
                  objectMetadataItem: opportunityObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.assignee,
                    STATUS_BOARD_FIELD.assigneeId,
                  ],
                  memberIds,
                }),
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: opportunityObjectMetadataItem,
                  fieldNames: [STATUS_BOARD_FIELD.name],
                }),
              })
            }
          />
        )}
        {onboardingObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding}
            filter={buildStatusBoardMemberFilter({
              objectMetadataItem: onboardingObjectMetadataItem,
              fieldNames: [
                STATUS_BOARD_FIELD.leadConsultant,
                STATUS_BOARD_FIELD.leadConsultantId,
                STATUS_BOARD_FIELD.executionConsultant,
                STATUS_BOARD_FIELD.executionConsultantId,
              ],
              memberIds,
            })}
            label="계약"
            onClick={() =>
              onOpenSheet({
                title: '누적 계약',
                objectNameSingular:
                  STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
                filter: buildStatusBoardMemberFilter({
                  objectMetadataItem: onboardingObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.leadConsultant,
                    STATUS_BOARD_FIELD.leadConsultantId,
                    STATUS_BOARD_FIELD.executionConsultant,
                    STATUS_BOARD_FIELD.executionConsultantId,
                  ],
                  memberIds,
                }),
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: onboardingObjectMetadataItem,
                  fieldNames: [STATUS_BOARD_FIELD.name],
                }),
              })
            }
          />
        )}
        {depositObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit}
            filter={buildStatusBoardMemberFilter({
              objectMetadataItem: depositObjectMetadataItem,
              fieldNames: [
                STATUS_BOARD_FIELD.creator,
                STATUS_BOARD_FIELD.creatorId,
              ],
              memberIds,
            })}
            label="입금"
            onClick={() =>
              onOpenSheet({
                title: '누적 입금',
                objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit,
                filter: buildStatusBoardMemberFilter({
                  objectMetadataItem: depositObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.creator,
                    STATUS_BOARD_FIELD.creatorId,
                  ],
                  memberIds,
                }),
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: depositObjectMetadataItem,
                  fieldNames: [STATUS_BOARD_FIELD.name],
                }),
              })
            }
          />
        )}
      </StyledStatusBoardCumulativeGrid>
    </StyledStatusBoardSection>
  );
};
