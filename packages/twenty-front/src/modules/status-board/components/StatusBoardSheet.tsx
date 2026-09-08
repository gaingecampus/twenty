import { useEffect, useId, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { useStatusBoardCount } from '@/status-board/hooks/useStatusBoardCount';
import {
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
  StyledStatusBoardSheet,
  StyledStatusBoardSheetBackdrop,
  StyledStatusBoardSheetCloseButton,
  StyledStatusBoardSheetBody,
  StyledStatusBoardSearch,
  StyledStatusBoardMuted,
} from '@/status-board/components/statusBoardStyled';
import { StatusBoardRecordList } from '@/status-board/components/StatusBoardRecordList';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
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
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), 200);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const filter = andStatusBoardFilters([
    sheet.filter,
    debouncedSearch === ''
      ? undefined
      : sheet.objectNameSingular === 'person'
        ? {
            or: [
              { name: { firstName: { ilike: `%${debouncedSearch}%` } } },
              { name: { lastName: { ilike: `%${debouncedSearch}%` } } },
            ],
          }
        : { name: { ilike: `%${debouncedSearch}%` } },
  ]);
  const { count, loading } = useStatusBoardCount({
    objectNameSingular: sheet.objectNameSingular,
    filter,
  });

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('input')?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <StyledStatusBoardSheetBackdrop onClick={onClose} role="presentation">
      <StyledStatusBoardSheet
        ref={dialogRef}
        role="dialog"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
          }
          if (event.key !== 'Tab') return;
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, a[href]',
          );
          const first = focusable?.[0];
          const last = focusable?.[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        aria-modal="true"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <StyledStatusBoardSectionHeader>
          <StyledStatusBoardSectionTitle id={titleId}>
            {sheet.title}
          </StyledStatusBoardSectionTitle>
          <StyledStatusBoardMuted>
            {loading ? '…' : `${count}건`}
          </StyledStatusBoardMuted>
          <StyledStatusBoardSheetCloseButton
            type="button"
            aria-label="닫기"
            onClick={onClose}
          >
            ✕
          </StyledStatusBoardSheetCloseButton>
        </StyledStatusBoardSectionHeader>
        <StyledStatusBoardSearch
          aria-label="목록 검색"
          placeholder="검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <StyledStatusBoardSheetBody>
          <StatusBoardRecordList
            objectNameSingular={sheet.objectNameSingular}
            filter={filter}
            recordGqlFields={sheet.recordGqlFields}
            emptyLabel="해당 항목 없음"
          />
        </StyledStatusBoardSheetBody>
      </StyledStatusBoardSheet>
    </StyledStatusBoardSheetBackdrop>
  );
};
