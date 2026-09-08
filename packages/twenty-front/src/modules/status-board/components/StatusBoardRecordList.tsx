import { useState } from 'react';
import { StatusBoardRecordAvatar } from '@/status-board/components/StatusBoardRecordAvatar';
import { StatusBoardEmptyState } from '@/status-board/components/StatusBoardEmptyState';
import {
  StatusBoardRecordDetails,
  StatusBoardContractDetails,
} from '@/status-board/components/StatusBoardRecordDetails';
import {
  StyledStatusBoardContract,
  StyledStatusBoardPagination,
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
  type StatusBoardTone,
} from '@/status-board/components/statusBoardStyled';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { useStatusBoardFindManyRecords } from '@/status-board/hooks/useStatusBoardFindManyRecords';
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
  totalCount?: number;
  orderBy?: RecordGqlOperationVariables['orderBy'];
};

const StatusBoardRecordRowContent = ({
  record,
  objectNameSingular,
}: {
  record: ObjectRecord;
  objectNameSingular: string;
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
        <StatusBoardRecordDetails
          record={record}
          objectNameSingular={objectNameSingular}
        />
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
  totalCount = 0,
  orderBy,
}: StatusBoardRecordListProps) => {
  const [page, setPage] = useState(0);
  const [fetchingPage, setFetchingPage] = useState(false);
  const pageSize = 10;
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } =
    useStatusBoardFindManyRecords({
      objectNameSingular,
      filter,
      limit: paginated ? pageSize : STATUS_BOARD_LIMITS.list,
      orderBy,
      recordGqlFields,
    });

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

  if (records.length === 0) {
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
        {(paginated
          ? records.slice(page * pageSize, (page + 1) * pageSize)
          : records
        ).map((record) =>
          isStatusBoardDummyRecordId(record.id) ? (
            <StyledStatusBoardRow key={record.id}>
              <StatusBoardRecordRowContent
                record={record}
                objectNameSingular={objectNameSingular}
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
            {page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, records.length)} /{' '}
            {totalCount.toLocaleString('ko-KR')}건
          </span>
          <StyledStatusBoardPeriodNavButton
            type="button"
            aria-label="이전 페이지"
            disabled={page === 0 || fetchingPage || loading}
            onClick={() => {
              setPage(page - 1);
              onPageChange?.();
            }}
          >
            ‹
          </StyledStatusBoardPeriodNavButton>
          <span>
            {page + 1} / {Math.max(1, Math.ceil(totalCount / pageSize))}
          </span>
          <StyledStatusBoardPeriodNavButton
            type="button"
            aria-label="다음 페이지"
            disabled={
              fetchingPage ||
              loading ||
              ((page + 1) * pageSize >= records.length && !hasNextPage)
            }
            onClick={async () => {
              if ((page + 1) * pageSize >= records.length) {
                setFetchingPage(true);
                try {
                  await fetchMoreRecords();
                } catch {
                  return;
                } finally {
                  setFetchingPage(false);
                }
              }
              setPage(page + 1);
              onPageChange?.();
            }}
          >
            ›
          </StyledStatusBoardPeriodNavButton>
        </StyledStatusBoardPagination>
      )}
    </>
  );
};
