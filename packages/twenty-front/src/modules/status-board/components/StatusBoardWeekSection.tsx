import {
  StyledStatusBoardSection,
  StyledStatusBoardSectionTitle,
  StyledStatusBoardWeekCell,
  StyledStatusBoardWeekGrid,
  StyledStatusBoardWeekRow,
} from '@/status-board/components/statusBoardStyled';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { STATUS_BOARD_WEEK_DAYS } from '@/status-board/constants/StatusBoardWeekDays';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { buildStatusBoardActiveOnboardingFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

const getVisitDays = (record: ObjectRecord): string[] => {
  const visitDays = record.visitDays;

  if (!Array.isArray(visitDays)) {
    return [];
  }

  return visitDays
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (
        typeof item === 'object' &&
        item !== null &&
        'value' in item &&
        typeof item.value === 'string'
      ) {
        return item.value;
      }

      return '';
    })
    .filter((item) => item.length > 0);
};

type StatusBoardWeekSectionProps = {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
};

export const StatusBoardWeekSection = ({
  onboardingObjectMetadataItem,
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
      memberIds={memberIds}
    />
  );
};

const StatusBoardWeekSectionLoaded = ({
  onboardingObjectMetadataItem,
  memberIds,
}: {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem;
  memberIds: string[] | undefined;
}) => {
  const { records, loading } = useFindManyRecords({
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
        STATUS_BOARD_FIELD.leadConsultant,
      ],
    }),
  });

  const todayKey = STATUS_BOARD_WEEK_DAYS[new Date().getDay() - 1]?.[0];

  return (
    <StyledStatusBoardSection>
      <StyledStatusBoardSectionTitle>이번 주 현장</StyledStatusBoardSectionTitle>
      {loading && records.length === 0 ? (
        <div>불러오는 중</div>
      ) : (
        <StyledStatusBoardWeekGrid>
          <StyledStatusBoardWeekRow>
            <div />
            {STATUS_BOARD_WEEK_DAYS.map(([key, label]) => (
              <div key={key}>{label}</div>
            ))}
          </StyledStatusBoardWeekRow>
          {records.map((record) => {
            const visitDays = getVisitDays(record);

            return (
              <StyledStatusBoardWeekRow key={record.id}>
                <div>{getStatusBoardRecordLabel(record)}</div>
                {STATUS_BOARD_WEEK_DAYS.map(([key]) => (
                  <StyledStatusBoardWeekCell
                    key={key}
                    isToday={key === todayKey}
                  >
                    {visitDays.includes(key) ? (
                      <a
                        href={getAppPath(AppPath.RecordShowPage, {
                          objectNameSingular:
                            STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
                          objectRecordId: record.id,
                        })}
                      >
                        {getStatusBoardRecordLabel(record)}
                      </a>
                    ) : null}
                  </StyledStatusBoardWeekCell>
                ))}
              </StyledStatusBoardWeekRow>
            );
          })}
        </StyledStatusBoardWeekGrid>
      )}
    </StyledStatusBoardSection>
  );
};
