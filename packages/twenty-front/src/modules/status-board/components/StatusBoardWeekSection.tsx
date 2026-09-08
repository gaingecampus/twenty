import { StatusBoardEmptyState } from '@/status-board/components/StatusBoardEmptyState';
import {
  StyledStatusBoardMuted,
  StyledStatusBoardWeekSection,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
  StyledStatusBoardWeekCell,
  StyledStatusBoardWeekCellBlock,
  StyledStatusBoardWeekCellLink,
  StyledStatusBoardWeekCellMeta,
  StyledStatusBoardWeekCellTitle,
  StyledStatusBoardWeekGrid,
  StyledStatusBoardWeekHeaderCell,
  StyledStatusBoardWeekNote,
  StyledStatusBoardWeekRow,
  StyledStatusBoardWeekWho,
  StyledStatusBoardWeekWhoMeta,
  StyledStatusBoardWeekWhoName,
  StyledStatusBoardWeekWrap,
} from '@/status-board/components/statusBoardStyled';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_WEEK_DAYS } from '@/status-board/constants/StatusBoardWeekDays';
import { useStatusBoardFindManyRecords } from '@/status-board/hooks/useStatusBoardFindManyRecords';
import { isStatusBoardDummyRecordId } from '@/status-board/utils/buildStatusBoardDummyDataset';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { buildStatusBoardActiveOnboardingFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import {
  getStatusBoardCompanyName,
  getStatusBoardMemberRoleOnOnboarding,
  getStatusBoardShortMemberName,
  getStatusBoardVisitCadence,
  getStatusBoardVisitDays,
  isStatusBoardOnboardingOwnedByMember,
  STATUS_BOARD_VISIT_CADENCE_LABEL,
} from '@/status-board/utils/getStatusBoardWeekVisitInfo';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

type StatusBoardWeekSectionProps = {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  members: ObjectRecord[];
  memberIds: string[] | undefined;
};

export const StatusBoardWeekSection = ({
  onboardingObjectMetadataItem,
  members,
  memberIds,
}: StatusBoardWeekSectionProps) => {
  if (
    onboardingObjectMetadataItem === undefined ||
    !hasStatusBoardField(
      onboardingObjectMetadataItem,
      STATUS_BOARD_FIELD.visitDays,
    )
  ) {
    return null;
  }

  return (
    <StatusBoardWeekSectionLoaded
      onboardingObjectMetadataItem={onboardingObjectMetadataItem}
      members={members}
      memberIds={memberIds}
    />
  );
};

const StatusBoardWeekSectionLoaded = ({
  onboardingObjectMetadataItem,
  members,
  memberIds,
}: {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem;
  members: ObjectRecord[];
  memberIds: string[] | undefined;
}) => {
  const { records, loading, error, refetch } = useStatusBoardFindManyRecords({
    objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
    filter: buildStatusBoardActiveOnboardingFilter({
      onboardingObjectMetadataItem,
      memberIds,
    }),
    limit: STATUS_BOARD_LIMITS.week,
    recordGqlFields: buildStatusBoardRecordGqlFields({
      objectMetadataItem: onboardingObjectMetadataItem,
      fieldNames: [
        STATUS_BOARD_FIELD.name,
        STATUS_BOARD_FIELD.company,
        STATUS_BOARD_FIELD.visitDays,
        STATUS_BOARD_FIELD.visitCadence,
        STATUS_BOARD_FIELD.executionConsultant,
        STATUS_BOARD_FIELD.executionConsultantId,
        STATUS_BOARD_FIELD.leadConsultant,
        STATUS_BOARD_FIELD.leadConsultantId,
      ],
    }),
  });

  const todayKey = STATUS_BOARD_WEEK_DAYS[new Date().getDay() - 1]?.[0];
  const weekdayKeys = STATUS_BOARD_WEEK_DAYS.map(([key]) => key);

  const memberRows = [...members]
    .map((member) => {
      const memberOnboardings = records.filter((onboarding) =>
        isStatusBoardOnboardingOwnedByMember({
          onboarding,
          memberId: member.id,
        }),
      );

      return {
        member,
        memberOnboardings,
      };
    })
    .filter(({ memberOnboardings }) => memberOnboardings.length > 0)
    .sort(
      (left, right) =>
        right.memberOnboardings.length - left.memberOnboardings.length,
    );

  const undatedNotes = memberRows.flatMap(({ member, memberOnboardings }) =>
    memberOnboardings
      .filter((onboarding) => {
        const visitDays = getStatusBoardVisitDays(onboarding);

        return !visitDays.some((visitDay) =>
          weekdayKeys.some((key) => key === visitDay),
        );
      })
      .map((onboarding) => {
        const cadence = getStatusBoardVisitCadence(onboarding);
        const cadenceLabel =
          cadence !== undefined
            ? STATUS_BOARD_VISIT_CADENCE_LABEL[cadence]
            : '요일 미정';

        return `${getStatusBoardShortMemberName(getStatusBoardRecordLabel(member))} · ${getStatusBoardCompanyName(onboarding)} (${cadenceLabel})`;
      }),
  );

  return (
    <StyledStatusBoardWeekSection>
      <StyledStatusBoardSectionHeader>
        <StyledStatusBoardSectionTitle>
          이번 주 현장
        </StyledStatusBoardSectionTitle>
        {undatedNotes.length > 0 && (
          <StyledStatusBoardMuted>
            {`요일 미정 ${undatedNotes.length}건`}
          </StyledStatusBoardMuted>
        )}
      </StyledStatusBoardSectionHeader>
      {loading && records.length === 0 ? (
        <StatusBoardEmptyState
          title="방문 일정을 불러오는 중이에요"
          description="선택한 조건의 일정을 확인하고 있어요."
          variant="calendar"
        />
      ) : error ? (
        <StatusBoardEmptyState
          title="방문 일정을 불러오지 못했어요"
          variant="connection"
          actionLabel="다시 불러오기"
          onAction={() => {
            void refetch();
          }}
        />
      ) : memberRows.length === 0 ? (
        <StatusBoardEmptyState
          title="표시할 방문 일정이 없어요"
          description="선택한 구성원의 방문 일정을 찾지 못했어요. 진행 중 계약의 담당자와 방문 요일을 확인해 주세요."
          variant="calendar"
        />
      ) : (
        <>
          <StyledStatusBoardWeekWrap>
            <StyledStatusBoardWeekGrid>
              <StyledStatusBoardWeekRow>
                <StyledStatusBoardWeekHeaderCell />
                {STATUS_BOARD_WEEK_DAYS.map(([key, label]) => (
                  <StyledStatusBoardWeekHeaderCell
                    key={key}
                    isToday={key === todayKey}
                  >
                    {label}
                  </StyledStatusBoardWeekHeaderCell>
                ))}
              </StyledStatusBoardWeekRow>
              {memberRows.map(({ member, memberOnboardings }) => {
                const memberName = getStatusBoardShortMemberName(
                  getStatusBoardRecordLabel(member),
                );
                const groupName =
                  typeof member.currentGroup === 'object' &&
                  member.currentGroup !== null &&
                  'name' in member.currentGroup &&
                  typeof member.currentGroup.name === 'string'
                    ? member.currentGroup.name
                    : undefined;

                return (
                  <StyledStatusBoardWeekRow key={member.id}>
                    <StyledStatusBoardWeekWho>
                      <StyledStatusBoardWeekWhoName>
                        {memberName}
                      </StyledStatusBoardWeekWhoName>
                      <StyledStatusBoardWeekWhoMeta>
                        {[groupName, `진행 ${memberOnboardings.length}건`]
                          .filter((item) => item !== undefined && item !== '')
                          .join(' · ')}
                      </StyledStatusBoardWeekWhoMeta>
                    </StyledStatusBoardWeekWho>
                    {STATUS_BOARD_WEEK_DAYS.map(([key]) => {
                      const visits = memberOnboardings.filter((onboarding) =>
                        getStatusBoardVisitDays(onboarding).includes(key),
                      );
                      const firstCadence =
                        visits.length > 0
                          ? getStatusBoardVisitCadence(visits[0])
                          : undefined;
                      const cellCadence =
                        firstCadence === 'BIWEEKLY'
                          ? 'BIWEEKLY'
                          : firstCadence === 'WEEKLY'
                            ? 'WEEKLY'
                            : visits.length > 0
                              ? 'OTHER'
                              : undefined;

                      return (
                        <StyledStatusBoardWeekCell
                          key={key}
                          isToday={key === todayKey}
                          hasVisit={visits.length > 0}
                          cadence={cellCadence}
                        >
                          {visits.map((onboarding) => {
                            const cadence =
                              getStatusBoardVisitCadence(onboarding);
                            const cadenceLabel =
                              cadence !== undefined
                                ? STATUS_BOARD_VISIT_CADENCE_LABEL[cadence]
                                : '';
                            const role = getStatusBoardMemberRoleOnOnboarding({
                              onboarding,
                              memberId: member.id,
                            });
                            const titleCadence =
                              cadence === 'BIWEEKLY'
                                ? 'BIWEEKLY'
                                : cadence === 'WEEKLY'
                                  ? 'WEEKLY'
                                  : 'OTHER';
                            const content = (
                              <>
                                <StyledStatusBoardWeekCellTitle
                                  cadence={titleCadence}
                                >
                                  {getStatusBoardCompanyName(onboarding)}
                                </StyledStatusBoardWeekCellTitle>
                                <StyledStatusBoardWeekCellMeta>
                                  {[cadenceLabel, role]
                                    .filter(
                                      (item) =>
                                        item !== undefined && item.length > 0,
                                    )
                                    .join(' · ')}
                                </StyledStatusBoardWeekCellMeta>
                              </>
                            );

                            if (isStatusBoardDummyRecordId(onboarding.id)) {
                              return (
                                <StyledStatusBoardWeekCellBlock
                                  key={onboarding.id}
                                >
                                  {content}
                                </StyledStatusBoardWeekCellBlock>
                              );
                            }

                            return (
                              <StyledStatusBoardWeekCellLink
                                key={onboarding.id}
                                href={getAppPath(AppPath.RecordShowPage, {
                                  objectNameSingular:
                                    STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
                                  objectRecordId: onboarding.id,
                                })}
                              >
                                {content}
                              </StyledStatusBoardWeekCellLink>
                            );
                          })}
                        </StyledStatusBoardWeekCell>
                      );
                    })}
                  </StyledStatusBoardWeekRow>
                );
              })}
            </StyledStatusBoardWeekGrid>
          </StyledStatusBoardWeekWrap>
          {undatedNotes.length > 0 && (
            <StyledStatusBoardWeekNote>
              {`요일 미정 ${undatedNotes.length}건 · ${undatedNotes.join(', ')}`}
            </StyledStatusBoardWeekNote>
          )}
        </>
      )}
    </StyledStatusBoardWeekSection>
  );
};
