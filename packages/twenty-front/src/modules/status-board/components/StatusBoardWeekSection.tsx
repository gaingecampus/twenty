import { getContractSessionProgress } from '@/field-management/getContractSessionProgress';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useState } from 'react';
import { useStatusBoardOnboardingMetrics } from '@/status-board/hooks/useStatusBoardOnboardingMetrics';
import { StatusBoardRecordAvatar } from '@/status-board/components/StatusBoardRecordAvatar';
import { StatusBoardEmptyState } from '@/status-board/components/StatusBoardEmptyState';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { getStatusBoardMemberGroupId } from '@/status-board/utils/getStatusBoardMemberGroupId';
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
  StyledStatusBoardCadenceBadge,
  StyledStatusBoardCadenceRow,
  StyledStatusBoardWeekRow,
  StyledStatusBoardWeekWho,
  StyledStatusBoardWeekIdentity,
  StyledStatusBoardWeekWhoMeta,
  StyledStatusBoardWeekWhoName,
  StyledStatusBoardWeekWrap,
} from '@/status-board/components/statusBoardStyled';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_WEEK_DAYS } from '@/status-board/constants/StatusBoardWeekDays';
import { useStatusBoardAllRecords } from '@/status-board/hooks/useStatusBoardAllRecords';
import { isStatusBoardDummyRecordId } from '@/status-board/utils/buildStatusBoardDummyDataset';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { buildStatusBoardActiveOnboardingFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import {
  getStatusBoardCompanyName,
  getStatusBoardMemberRoleOnOnboarding,
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
  memberObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  members: ObjectRecord[];
  memberIds: string[] | undefined;
};

export const StatusBoardWeekSection = ({
  onboardingObjectMetadataItem,
  memberObjectMetadataItem,
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
      memberObjectMetadataItem={memberObjectMetadataItem}
      members={members}
      memberIds={memberIds}
    />
  );
};

const StatusBoardWeekSectionLoaded = ({
  onboardingObjectMetadataItem,
  memberObjectMetadataItem,
  members,
  memberIds,
}: {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem;
  memberObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  members: ObjectRecord[];
  memberIds: string[] | undefined;
}) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { groups } = useStatusBoardDummyData();
  const groupOrder = new Map(groups.map((group, index) => [group.id, index]));
  const [showLeadConsultants, setShowLeadConsultants] = useState(false);
  const assignmentData = useStatusBoardOnboardingMetrics({
    objectMetadataItem: onboardingObjectMetadataItem,
  });
  const { assignments, projectMetrics } = assignmentData;
  const projectMemberIds = projectMetrics.memberIdsByOnboardingId;
  const {
    records,
    loading: contractsLoading,
    error: contractsError,
    refetch,
  } = useStatusBoardAllRecords({
    objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
    filter: buildStatusBoardActiveOnboardingFilter({
      onboardingObjectMetadataItem,
      memberIds: undefined,
    }),
    limit: STATUS_BOARD_LIMITS.week,
    recordGqlFields: buildStatusBoardRecordGqlFields({
      objectMetadataItem: onboardingObjectMetadataItem,
      fieldNames: [
        'plannedSessionCount',
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

  const { objectMetadataItems } = useObjectMetadataItems();
  const visitMetadata = objectMetadataItems.find(
    (item) => item.nameSingular === 'fieldVisit',
  );
  const { canReadObjectRecords } = useObjectPermissionsForObject(
    visitMetadata?.id ?? onboardingObjectMetadataItem.id,
  );
  const canReadProgress = Boolean(
    visitMetadata &&
    canReadObjectRecords &&
    ['contract', 'sessionNumber', 'recordStatus'].every((name) =>
      hasStatusBoardField(visitMetadata, name),
    ),
  );
  const sessionVisits = useStatusBoardAllRecords({
    objectNameSingular:
      visitMetadata?.nameSingular ?? onboardingObjectMetadataItem.nameSingular,
    skip: !canReadProgress || records.length === 0,
    filter: {
      contractId: { in: records.map((record) => record.id) },
      recordStatus: { eq: 'SUBMITTED' },
    },
    limit: 200,
    recordGqlFields: {
      id: true,
      contractId: true,
      sessionNumber: true,
      recordStatus: true,
    },
  });

  const loading = contractsLoading || assignmentData.loading;
  const error = contractsError ?? assignmentData.error;
  const todayKey = STATUS_BOARD_WEEK_DAYS[new Date().getDay() - 1]?.[0];
  const weekdayKeys = STATUS_BOARD_WEEK_DAYS.map(([key]) => key);

  const memberRows = [...members]
    .map((member) => {
      const memberOnboardings = records.filter(
        (onboarding) =>
          (memberIds === undefined || memberIds.includes(member.id)) &&
          isStatusBoardOnboardingOwnedByMember({
            onboarding,
            memberId: member.id,
            assignments,
            showLeadConsultants,
          }),
      );

      return {
        member,
        memberOnboardings,
      };
    })
    .sort(
      (left, right) =>
        (groupOrder.get(getStatusBoardMemberGroupId(left.member) ?? '') ??
          groups.length) -
        (groupOrder.get(getStatusBoardMemberGroupId(right.member) ?? '') ??
          groups.length),
    );

  const visibleContractIds = new Set(
    memberRows.flatMap((row) =>
      row.memberOnboardings.map((record) => record.id),
    ),
  );
  const undatedCount = records.filter(
    (onboarding) =>
      visibleContractIds.has(onboarding.id) &&
      !projectMemberIds[onboarding.id] &&
      !getStatusBoardVisitDays(onboarding).some((day) =>
        weekdayKeys.some((key) => key === day),
      ),
  ).length;

  return (
    <StyledStatusBoardWeekSection>
      <StyledStatusBoardSectionHeader>
        <StyledStatusBoardSectionTitle>
          담당자별 수행 일정
        </StyledStatusBoardSectionTitle>
        <div data-week-header-controls>
          {undatedCount > 0 && (
            <StyledStatusBoardMuted>
              {`요일 미정 ${undatedCount}건`}
            </StyledStatusBoardMuted>
          )}
          <label>
            <input
              type="checkbox"
              checked={showLeadConsultants}
              onChange={(event) => setShowLeadConsultants(event.target.checked)}
            />
            리드 컨설턴트 표시
          </label>
          <StyledStatusBoardCadenceRow aria-label="방문 주기 구분">
            {(['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const).map((cadence) => (
              <StyledStatusBoardCadenceBadge key={cadence} cadence={cadence}>
                {STATUS_BOARD_VISIT_CADENCE_LABEL[cadence]}
              </StyledStatusBoardCadenceBadge>
            ))}
          </StyledStatusBoardCadenceRow>
        </div>
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
          title="표시할 구성원이 없어요"
          description="선택한 그룹과 구성원 필터를 확인해 주세요."
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
                <StyledStatusBoardWeekHeaderCell>
                  프로젝트
                </StyledStatusBoardWeekHeaderCell>
              </StyledStatusBoardWeekRow>
              {memberRows.map(({ member, memberOnboardings }) => {
                const memberName = getStatusBoardRecordLabel(member);
                const groupName =
                  typeof member.currentGroup === 'object' &&
                  member.currentGroup !== null &&
                  'name' in member.currentGroup &&
                  typeof member.currentGroup.name === 'string'
                    ? member.currentGroup.name
                    : undefined;

                return (
                  <StyledStatusBoardWeekRow key={member.id}>
                    <StyledStatusBoardWeekIdentity>
                      {memberObjectMetadataItem && (
                        <StatusBoardRecordAvatar
                          record={member}
                          objectNameSingular={
                            memberObjectMetadataItem.nameSingular
                          }
                        />
                      )}
                      <StyledStatusBoardWeekWho>
                        <StyledStatusBoardWeekWhoName title={memberName}>
                          {memberName}
                        </StyledStatusBoardWeekWhoName>
                        <StyledStatusBoardWeekWhoMeta>
                          {[groupName, `진행 ${memberOnboardings.length}건`]
                            .filter((item) => item !== undefined && item !== '')
                            .join(' · ')}
                        </StyledStatusBoardWeekWhoMeta>
                        <StyledStatusBoardCadenceRow>
                          {[
                            ...new Set(
                              memberOnboardings
                                .filter(
                                  (record) => !projectMemberIds[record.id],
                                )
                                .map(getStatusBoardVisitCadence),
                            ),
                          ].map((cadence) => (
                            <StyledStatusBoardCadenceBadge
                              key={cadence ?? 'unknown'}
                              cadence={cadence}
                            >
                              {cadence
                                ? STATUS_BOARD_VISIT_CADENCE_LABEL[cadence]
                                : '주기 미정'}{' '}
                              {
                                memberOnboardings.filter(
                                  (record) =>
                                    getStatusBoardVisitCadence(record) ===
                                    cadence,
                                ).length
                              }
                              건
                            </StyledStatusBoardCadenceBadge>
                          ))}
                        </StyledStatusBoardCadenceRow>
                      </StyledStatusBoardWeekWho>
                    </StyledStatusBoardWeekIdentity>
                    {[
                      ...STATUS_BOARD_WEEK_DAYS,
                      ['PROJECT', '프로젝트'] as const,
                    ].map(([key]) => {
                      const visits = memberOnboardings.filter((onboarding) =>
                        key === 'PROJECT'
                          ? Boolean(projectMemberIds[onboarding.id])
                          : !projectMemberIds[onboarding.id] &&
                            getStatusBoardVisitDays(onboarding).some(
                              (day) => day === key,
                            ),
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
                              assignments,
                              showLeadConsultants,
                            });
                            const titleCadence =
                              cadence === 'BIWEEKLY'
                                ? 'BIWEEKLY'
                                : cadence === 'WEEKLY'
                                  ? 'WEEKLY'
                                  : 'OTHER';
                            const progress = getContractSessionProgress(
                              onboarding,
                              sessionVisits.records,
                            );
                            const progressLabel =
                              !canReadProgress || sessionVisits.error
                                ? '회차 확인 불가'
                                : sessionVisits.loading
                                  ? '회차 확인 중…'
                                  : progress.total === null
                                    ? `현재 ${progress.current}회차 · 총 회차 미정`
                                    : `${progress.current}회차 / 총 ${progress.total}회`;
                            const content = (
                              <>
                                <StyledStatusBoardWeekCellTitle
                                  cadence={titleCadence}
                                >
                                  {key === 'PROJECT'
                                    ? getStatusBoardRecordLabel(onboarding)
                                    : getStatusBoardCompanyName(onboarding)}
                                </StyledStatusBoardWeekCellTitle>
                                <StyledStatusBoardCadenceRow>
                                  <StyledStatusBoardCadenceBadge
                                    cadence={cadence}
                                  >
                                    {key === 'PROJECT'
                                      ? '프로젝트'
                                      : cadenceLabel || '주기 미정'}
                                  </StyledStatusBoardCadenceBadge>
                                </StyledStatusBoardCadenceRow>
                                <StyledStatusBoardWeekCellMeta>
                                  {progressLabel}
                                </StyledStatusBoardWeekCellMeta>
                                {role && (
                                  <StyledStatusBoardWeekCellMeta>
                                    {role}
                                  </StyledStatusBoardWeekCellMeta>
                                )}
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
                                onClick={(event) => {
                                  if (
                                    event.metaKey ||
                                    event.ctrlKey ||
                                    event.shiftKey ||
                                    event.altKey
                                  )
                                    return;
                                  event.preventDefault();
                                  openRecordInSidePanel({
                                    recordId: onboarding.id,
                                    objectNameSingular:
                                      STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
                                  });
                                }}
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
        </>
      )}
    </StyledStatusBoardWeekSection>
  );
};
