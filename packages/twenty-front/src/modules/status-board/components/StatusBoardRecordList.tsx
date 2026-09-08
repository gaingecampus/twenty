import {
  StyledStatusBoardEmpty,
  StyledStatusBoardGroupTitle,
  StyledStatusBoardMoreButton,
  StyledStatusBoardRowLink,
  StyledStatusBoardRowList,
} from '@/status-board/components/statusBoardStyled';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { t } from '@lingui/core/macro';
import { AppPath, type RecordGqlOperationFilter } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

type StatusBoardRecordListProps = {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  recordGqlFields: RecordGqlFields;
  emptyLabel: string;
  heading?: string;
};

export const StatusBoardRecordList = ({
  objectNameSingular,
  filter,
  recordGqlFields,
  emptyLabel,
  heading,
}: StatusBoardRecordListProps) => {
  const { records, loading, hasNextPage, fetchMoreRecords } =
    useFindManyRecords({
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
      {records.map((record) => (
        <StyledStatusBoardRowLink
          key={record.id}
          to={getAppPath(AppPath.RecordShowPage, {
            objectNameSingular,
            objectRecordId: record.id,
          })}
        >
          <span>{getStatusBoardRecordLabel(record)}</span>
        </StyledStatusBoardRowLink>
      ))}
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
