import { StatusBoardCompanyActivity } from '@/status-board/components/StatusBoardCompanyActivity';
import { useState } from 'react';
import { StatusBoardRecordAvatar } from '@/status-board/components/StatusBoardRecordAvatar';
import { StatusBoardEmptyState } from '@/status-board/components/StatusBoardEmptyState';
import { StatusBoardConsultantAvatars } from '@/status-board/components/StatusBoardConsultantAvatars';
import {
  StatusBoardRecordDetails,
  StatusBoardContractDday,
  StatusBoardContractDetails,
  StatusBoardContractProgress,
} from '@/status-board/components/StatusBoardRecordDetails';
import {
  StyledStatusBoardContract,
  StyledStatusBoardPagination,
  StyledStatusBoardPageButton,
  StyledStatusBoardPageGap,
  StyledStatusBoardPeriodNavButton,
  StyledStatusBoardContractTop,
  StyledStatusBoardGroupTitle,
  StyledStatusBoardMoreButton,
  StyledStatusBoardRow,
  StyledStatusBoardRowBody,
  StyledStatusBoardRowCaption,
  StyledStatusBoardRowLink,
  StyledStatusBoardRowList,
  StyledStatusBoardRowName,
  StyledStatusBoardRowBadge,
  type StatusBoardTone,
} from '@/status-board/components/statusBoardStyled';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { useStatusBoardFindManyRecords } from '@/status-board/hooks/useStatusBoardFindManyRecords';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { useStatusBoardRecordPage } from '@/status-board/hooks/useStatusBoardRecordPage';
import { getStatusBoardPageItems } from '@/status-board/utils/getStatusBoardPageItems';
import { isStatusBoardDummyRecordId } from '@/status-board/utils/buildStatusBoardDummyDataset';
import { getStatusBoardRecordCaption } from '@/status-board/utils/getStatusBoardRecordInitial';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { t } from '@lingui/core/macro';
import {
  AppPath,
  type RecordGqlOperationVariables,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

export type StatusBoardRecordMembers = {
  objectNameSingular: string;
  memberIdsByRecordId: Record<string, string[]>;
};

type StatusBoardRecordListProps = {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  recordGqlFields: RecordGqlFields;
  emptyLabel: string;
  emptyDescription?: string;
  emptyVariant?: 'document' | 'search';
  heading?: string;
  tone?: StatusBoardTone;
  paginated?: boolean;
  onPageChange?: () => void;
  orderBy?: RecordGqlOperationVariables['orderBy'];
  recordBadges?: Record<string, string>;
  recordMembers?: StatusBoardRecordMembers;
};

const StatusBoardRecordRowContent = ({
  record,
  objectNameSingular,
  badge,
  members,
  memberObjectNameSingular,
}: {
  record: ObjectRecord;
  objectNameSingular: string;
  badge?: string;
  members?: ObjectRecord[];
  memberObjectNameSingular?: string;
}) => {
  const companyCaption = getStatusBoardRecordCaption(record);
  const owners = ['assignee', 'leadConsultant', 'executionConsultant'].flatMap(
    (key) => {
      const owner = record[key];
      return owner &&
        typeof owner === 'object' &&
        typeof owner.name === 'string'
        ? [owner.name]
        : [];
    },
  );
  const caption = [
    companyCaption,
    ...new Set(owners),
    typeof record.expectedPaymentDate === 'string'
      ? `예정 ${record.expectedPaymentDate.slice(0, 10)}`
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  const isContract = record.onboardingStatus !== undefined;

  if (badge !== undefined) {
    return (
      <StyledStatusBoardContract>
        <StyledStatusBoardContractTop>
          <StatusBoardRecordAvatar
            record={record.company?.id ? record.company : record}
            objectNameSingular={
              record.company?.id ? 'company' : objectNameSingular
            }
          />
          <StyledStatusBoardRowBody>
            <StyledStatusBoardRowName title={getStatusBoardRecordLabel(record)}>
              {getStatusBoardRecordLabel(record)}
            </StyledStatusBoardRowName>
          </StyledStatusBoardRowBody>
          <StatusBoardContractDday record={record} />
          {members !== undefined && memberObjectNameSingular !== undefined && (
            <StatusBoardConsultantAvatars
              members={members}
              objectNameSingular={memberObjectNameSingular}
            />
          )}
          <StyledStatusBoardRowBadge>{badge}</StyledStatusBoardRowBadge>
        </StyledStatusBoardContractTop>
        <StatusBoardContractProgress record={record} />
      </StyledStatusBoardContract>
    );
  }

  return (
    <StyledStatusBoardContract>
      <StyledStatusBoardContractTop>
        <StatusBoardRecordAvatar
          record={record.company?.id ? record.company : record}
          objectNameSingular={
            record.company?.id ? 'company' : objectNameSingular
          }
        />
        <StyledStatusBoardRowBody>
          <StyledStatusBoardRowName title={getStatusBoardRecordLabel(record)}>
            {getStatusBoardRecordLabel(record)}
          </StyledStatusBoardRowName>
          {!isContract && caption.length > 0 && (
            <StyledStatusBoardRowCaption>{caption}</StyledStatusBoardRowCaption>
          )}
        </StyledStatusBoardRowBody>
        {objectNameSingular === 'company' ? (
          <StatusBoardCompanyActivity companyId={record.id} />
        ) : (
          <StatusBoardRecordDetails
            record={record}
            objectNameSingular={objectNameSingular}
          />
        )}
      </StyledStatusBoardContractTop>
      {isContract && <StatusBoardContractDetails record={record} />}
    </StyledStatusBoardContract>
  );
};

export const StatusBoardRecordList = ({
  objectNameSingular,
  filter,
  recordGqlFields,
  emptyLabel,
  emptyDescription,
  emptyVariant,
  heading,
  paginated = false,
  onPageChange,
  orderBy,
  recordBadges,
  recordMembers,
}: StatusBoardRecordListProps) => {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const list = useStatusBoardFindManyRecords({
    objectNameSingular,
    filter,
    limit: STATUS_BOARD_LIMITS.list,
    orderBy,
    recordGqlFields,
    skip: paginated,
  });
  const pageResult = useStatusBoardRecordPage({
    objectNameSingular,
    filter,
    orderBy,
    recordGqlFields,
    page,
    pageSize,
    skip: !paginated,
  });
  const { records, loading, error, refetch } = paginated ? pageResult : list;
  const memberObjectNameSingular =
    recordMembers?.objectNameSingular ?? objectNameSingular;
  const { objectMetadataItem: memberObjectMetadataItem } =
    useObjectMetadataItem({ objectNameSingular: memberObjectNameSingular });
  const memberIds = [
    ...new Set(
      records.flatMap(
        (record) => recordMembers?.memberIdsByRecordId[record.id] ?? [],
      ),
    ),
  ];
  const { records: memberRecords } = useStatusBoardFindManyRecords({
    objectNameSingular: memberObjectNameSingular,
    filter: { id: { in: memberIds } },
    limit: STATUS_BOARD_LIMITS.list,
    recordGqlFields: buildStatusBoardRecordGqlFields({
      objectMetadataItem: memberObjectMetadataItem,
      fieldNames: [STATUS_BOARD_FIELD.name],
    }),
    skip: memberIds.length === 0,
  });
  const getRecordMembers = (recordId: string) => {
    const ids = recordMembers?.memberIdsByRecordId[recordId];
    return ids?.flatMap((id) => {
      const member = memberRecords.find((candidate) => candidate.id === id);
      return member ? [member] : [];
    });
  };
  const { hasNextPage, fetchMoreRecords } = list;
  const totalCount = pageResult.totalCount;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 0), pageCount - 1));
    onPageChange?.();
  };

  if (loading && records.length === 0) {
    return (
      <StatusBoardEmptyState
        title={heading ?? '목록을 불러오는 중이에요'}
        description="선택한 조건의 항목을 확인하고 있어요."
        compact={heading !== undefined}
      />
    );
  }

  if (error) {
    return (
      <StatusBoardEmptyState
        title="목록을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        variant="connection"
        compact={heading !== undefined}
        actionLabel="다시 불러오기"
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  if (records.length === 0 && page === 0) {
    return (
      <StatusBoardEmptyState
        title={heading ?? emptyLabel}
        description={
          heading
            ? emptyLabel
            : (emptyDescription ??
              '선택한 조건에 해당하는 데이터가 없어요. 조회 범위나 상태를 바꿔 확인해 보세요.')
        }
        variant={emptyVariant}
        compact={heading !== undefined}
      />
    );
  }

  return (
    <>
      {heading !== undefined && (
        <StyledStatusBoardGroupTitle>{heading}</StyledStatusBoardGroupTitle>
      )}
      <StyledStatusBoardRowList
        hideSeparators={objectNameSingular === 'onboarding'}
      >
        {records.map((record) =>
          isStatusBoardDummyRecordId(record.id) ? (
            <StyledStatusBoardRow key={record.id}>
              <StatusBoardRecordRowContent
                record={record}
                objectNameSingular={objectNameSingular}
                badge={recordBadges?.[record.id]}
                members={getRecordMembers(record.id)}
                memberObjectNameSingular={recordMembers?.objectNameSingular}
              />
            </StyledStatusBoardRow>
          ) : (
            <StyledStatusBoardRowLink
              key={record.id}
              to={getAppPath(AppPath.RecordShowPage, {
                objectNameSingular,
                objectRecordId: record.id,
              })}
            >
              <StatusBoardRecordRowContent
                record={record}
                objectNameSingular={objectNameSingular}
                badge={recordBadges?.[record.id]}
                members={getRecordMembers(record.id)}
                memberObjectNameSingular={recordMembers?.objectNameSingular}
              />
            </StyledStatusBoardRowLink>
          ),
        )}
        {!paginated && hasNextPage === true && (
          <StyledStatusBoardMoreButton
            type="button"
            onClick={() => {
              void fetchMoreRecords();
            }}
          >
            {t`Load more`}
          </StyledStatusBoardMoreButton>
        )}
      </StyledStatusBoardRowList>
      {paginated && (
        <StyledStatusBoardPagination aria-label="목록 페이지 이동">
          <span>
            {(page * pageSize + 1).toLocaleString('ko-KR')}–
            {(page * pageSize + records.length).toLocaleString('ko-KR')} /{' '}
            {totalCount.toLocaleString('ko-KR')}건
          </span>
          <StyledStatusBoardPeriodNavButton
            type="button"
            aria-label="이전 페이지"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
          >
            ‹
          </StyledStatusBoardPeriodNavButton>
          {getStatusBoardPageItems({ currentPage: page, pageCount }).map(
            (item, index) =>
              item === 'gap' ? (
                <StyledStatusBoardPageGap key={`gap-${index}`} aria-hidden>
                  …
                </StyledStatusBoardPageGap>
              ) : (
                <StyledStatusBoardPageButton
                  key={item}
                  type="button"
                  isActive={item === page}
                  aria-label={`${item + 1}페이지`}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => goToPage(item)}
                >
                  {item + 1}
                </StyledStatusBoardPageButton>
              ),
          )}
          <StyledStatusBoardPeriodNavButton
            type="button"
            aria-label="다음 페이지"
            disabled={page >= pageCount - 1}
            onClick={() => goToPage(page + 1)}
          >
            ›
          </StyledStatusBoardPeriodNavButton>
        </StyledStatusBoardPagination>
      )}
    </>
  );
};
