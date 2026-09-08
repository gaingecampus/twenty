import {
  StatusBoardRecordDetails,
  StatusBoardContractDetails,
} from '@/status-board/components/StatusBoardRecordDetails';
import {
  StyledStatusBoardEmpty,
  StyledStatusBoardContract,
  StyledStatusBoardContractTop,
  StyledStatusBoardGroupTitle,
  StyledStatusBoardMoreButton,
  StyledStatusBoardRow,
  StyledStatusBoardRowAvatar,
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
import {
  getStatusBoardRecordCaption,
  getStatusBoardRecordInitial,
} from '@/status-board/utils/getStatusBoardRecordInitial';
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
  heading?: string;
  tone?: StatusBoardTone;
};

const StatusBoardRecordRowContent = ({
  record,
  tone,
}: {
  record: ObjectRecord;
  tone: StatusBoardTone;
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
        <StyledStatusBoardRowAvatar tone={tone}>
          {getStatusBoardRecordInitial(record)}
        </StyledStatusBoardRowAvatar>
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
  heading,
  tone = 'default',
}: StatusBoardRecordListProps) => {
  const { records, loading, hasNextPage, fetchMoreRecords } =
    useStatusBoardFindManyRecords({
      objectNameSingular,
      filter,
      limit: STATUS_BOARD_LIMITS.list,
      recordGqlFields,
    });

  if (loading && records.length === 0) {
    return (
      <>
        {heading !== undefined && (
          <StyledStatusBoardGroupTitle>{heading}</StyledStatusBoardGroupTitle>
        )}
        <StyledStatusBoardEmpty>{t`Loading`}</StyledStatusBoardEmpty>
      </>
    );
  }

  if (records.length === 0) {
    return (
      <>
        {heading !== undefined && (
          <StyledStatusBoardGroupTitle>{heading}</StyledStatusBoardGroupTitle>
        )}
        <StyledStatusBoardEmpty>{emptyLabel}</StyledStatusBoardEmpty>
      </>
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
              <StatusBoardRecordRowContent record={record} tone={tone} />
            </StyledStatusBoardRow>
          ) : (
            <StyledStatusBoardRowLink
              key={record.id}
              to={getAppPath(AppPath.RecordShowPage, {
                objectNameSingular,
                objectRecordId: record.id,
              })}
            >
              <StatusBoardRecordRowContent record={record} tone={tone} />
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
