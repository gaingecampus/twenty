import { StatusBoardRecordAvatar } from '@/status-board/components/StatusBoardRecordAvatar';
import { StatusBoardEmptyState } from '@/status-board/components/StatusBoardEmptyState';
import {
  StatusBoardRecordDetails,
  StatusBoardContractDetails,
} from '@/status-board/components/StatusBoardRecordDetails';
import {
  StyledStatusBoardContract,
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
import { AppPath, type RecordGqlOperationFilter } from 'twenty-shared/types';
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
          <StyledStatusBoardRowName>
            {getStatusBoardRecordLabel(record)}
          </StyledStatusBoardRowName>
          {caption.length > 0 && (
            <StyledStatusBoardRowCaption>{caption}</StyledStatusBoardRowCaption>
          )}
        </StyledStatusBoardRowBody>
        <StatusBoardRecordDetails record={record} />
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
}: StatusBoardRecordListProps) => {
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } =
    useStatusBoardFindManyRecords({
      objectNameSingular,
      filter,
      limit: STATUS_BOARD_LIMITS.list,
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
      <StyledStatusBoardRowList>
        {records.map((record) =>
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
        {hasNextPage === true && (
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
    </>
  );
};
