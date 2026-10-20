import { PersonalDashboardGrowth } from '@/personal-dashboard/components/PersonalDashboardGrowth';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RecordChip } from '@/object-record/components/RecordChip';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  StyledDashboardMuted,
  StyledDashboardSection,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { styled } from '@linaria/react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledIllustratedHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
`;
const StyledIllustration = styled.img`
  flex-shrink: 0;
  height: 72px;
  object-fit: contain;
  width: 72px;
`;
const StyledHeadingCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledRows = styled.ul`
  list-style: none;
  margin: 0;
  max-height: 280px;
  overflow: auto;
  padding: 0;
`;
const StyledRow = styled.li`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]} 0;
`;

export const PersonalDashboardList = ({
  title,
  description,
  imageSrc,
  growth,
  metadata,
  filter,
  unavailable,
  dateField = 'createdAt',
}: {
  title: string;
  description: string;
  imageSrc?: string;
  growth?: {
    label: string;
    dateField: string;
    filter?: RecordGqlOperationFilter;
  };
  metadata?: EnrichedObjectMetadataItem;
  filter?: RecordGqlOperationFilter;
  unavailable?: string;
  dateField?: string;
}) => (
  <StyledDashboardSection
    id={`personal-${metadata?.nameSingular ?? title}`}
    tabIndex={-1}
  >
    <StyledDashboardSectionHeader>
      <StyledIllustratedHeader>
        {imageSrc && (
          <StyledIllustration
            src={imageSrc}
            alt=""
            width={72}
            height={72}
            decoding="async"
          />
        )}
        <StyledHeadingCopy>
          <StyledDashboardSectionTitle>{title}</StyledDashboardSectionTitle>
          <StyledDashboardMuted>{description}</StyledDashboardMuted>
        </StyledHeadingCopy>
      </StyledIllustratedHeader>
    </StyledDashboardSectionHeader>
    {!metadata || !filter || unavailable ? (
      <StyledDashboardMuted role="status">
        {unavailable ?? '조회 권한 또는 담당자 필드가 없어 표시할 수 없습니다.'}
      </StyledDashboardMuted>
    ) : (
      <>
        {growth &&
          metadata.readableFields.some(
            (field) => field.name === growth.dateField,
          ) && (
            <PersonalDashboardGrowth
              objectNameSingular={metadata.nameSingular}
              filter={growth.filter ?? filter}
              dateField={growth.dateField}
              label={growth.label}
            />
          )}
        <PersonalDashboardRecords
          metadata={metadata}
          filter={filter}
          dateField={dateField}
        />
      </>
    )}
  </StyledDashboardSection>
);

const PersonalDashboardRecords = ({
  metadata,
  filter,
  dateField,
}: {
  metadata: EnrichedObjectMetadataItem;
  filter: RecordGqlOperationFilter;
  dateField: string;
}) => {
  const fields = ['name', 'title', dateField].filter((name) =>
    metadata.readableFields.some((field) => field.name === name),
  );
  const effectiveDateField = fields.includes(dateField)
    ? dateField
    : 'createdAt';
  const {
    records,
    totalCount,
    loading,
    error,
    hasNextPage,
    fetchMoreRecords,
    refetch,
  } = useFindManyRecords({
    objectNameSingular: metadata.nameSingular,
    filter,
    limit: 3,
    orderBy: [
      {
        [effectiveDateField]:
          dateField === 'dueAt' ? 'AscNullsLast' : 'DescNullsLast',
      },
    ],
    recordGqlFields: {
      id: true,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    },
  });
  return (
    <>
      {!error && (
        <StyledDashboardMuted>
          {loading ? '불러오는 중…' : `전체 ${totalCount ?? records.length}건`}
        </StyledDashboardMuted>
      )}
      {error ? (
        <>
          <StyledDashboardMuted role="alert">
            정보를 불러오지 못했습니다.
          </StyledDashboardMuted>
          <Button
            title="다시 시도"
            onClick={() => {
              void refetch().catch(() => undefined);
            }}
          />
        </>
      ) : (
        <StyledRows>
          {records.map((record) => (
            <StyledRow key={record.id}>
              <RecordChip
                objectNameSingular={metadata.nameSingular}
                record={record}
              />
              {typeof record[dateField] === 'string' && (
                <StyledDashboardMuted>
                  {new Date(record[dateField]).toLocaleDateString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                  })}
                </StyledDashboardMuted>
              )}
            </StyledRow>
          ))}
        </StyledRows>
      )}
      {!loading && !error && records.length === 0 && (
        <StyledDashboardMuted>
          {metadata.nameSingular === 'task'
            ? '남은 할 일이 없어요! 잠시 숨을 돌려도 좋아요.'
            : '아직 기록이 없어요. 첫 활동을 기다리고 있어요.'}
        </StyledDashboardMuted>
      )}
      {hasNextPage && !error && (
        <Button
          title="더 보기"
          disabled={loading}
          onClick={() => {
            void fetchMoreRecords().catch(() => undefined);
          }}
        />
      )}
    </>
  );
};
