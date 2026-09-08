import {
  StyledStatusBoardSheet,
  StyledStatusBoardSheetBackdrop,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
} from '@/status-board/components/statusBoardStyled';
import { StatusBoardRecordList } from '@/status-board/components/StatusBoardRecordList';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { t } from '@lingui/core/macro';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export type StatusBoardSheetState = {
  title: string;
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  recordGqlFields: RecordGqlFields;
};

type StatusBoardSheetProps = {
  sheet: StatusBoardSheetState;
  onClose: () => void;
};

export const StatusBoardSheet = ({ sheet, onClose }: StatusBoardSheetProps) => {
  return (
    <StyledStatusBoardSheetBackdrop onClick={onClose} role="presentation">
      <StyledStatusBoardSheet
        role="dialog"
        aria-modal="true"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <StyledStatusBoardSectionHeader>
          <StyledStatusBoardSectionTitle>
            {sheet.title}
          </StyledStatusBoardSectionTitle>
          <button type="button" onClick={onClose}>
            {t`Close`}
          </button>
        </StyledStatusBoardSectionHeader>
        <StatusBoardRecordList
          objectNameSingular={sheet.objectNameSingular}
          filter={sheet.filter}
          recordGqlFields={sheet.recordGqlFields}
          emptyLabel={t`No records`}
        />
      </StyledStatusBoardSheet>
    </StyledStatusBoardSheetBackdrop>
  );
};
