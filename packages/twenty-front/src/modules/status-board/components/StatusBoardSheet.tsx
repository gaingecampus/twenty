import { type DashboardTone } from '@/ui/layout/dashboard/components/dashboardStyled';
import { Select } from '@/ui/input/components/Select';
import { createPortal } from 'react-dom';
import {
  sidePanelHeaderActionsElementState,
  sidePanelHeaderTitleSuffixElementState,
} from '@/side-panel/states/sidePanelHeaderActionsElementState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildStatusBoardListUrl } from '@/status-board/utils/buildStatusBoardListUrl';
import { IconSearch, IconX, IconArrowUpRight } from 'twenty-ui/icon';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { useStatusBoardCount } from '@/status-board/hooks/useStatusBoardCount';
import {
  StyledStatusBoardSort,
  StyledStatusBoardSheetToolbar,
  StyledStatusBoardSheetListLink,
  StyledStatusBoardSheetCount,
  StyledStatusBoardSheet,
  StyledStatusBoardSheetBody,
  StyledStatusBoardModalSearch,
  StyledStatusBoardModalSearchInput,
  StyledStatusBoardSearchClear,
} from '@/status-board/components/statusBoardStyled';
import {
  StatusBoardRecordList,
  type StatusBoardRecordMembers,
} from '@/status-board/components/StatusBoardRecordList';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export type StatusBoardSheetState = {
  kpiLabel?: string;
  tone?: DashboardTone;
  listTarget?: {
    objectMetadataItem: EnrichedObjectMetadataItem;
    viewId?: string;
  };
  title: string;
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  recordGqlFields: RecordGqlFields;
  recordBadges?: Record<string, string>;
  recordMembers?: StatusBoardRecordMembers;
  summary?: string;
};

type StatusBoardSheetProps = {
  sheet: StatusBoardSheetState;
  onClose: () => void;
};

export const StatusBoardSheet = ({ sheet, onClose }: StatusBoardSheetProps) => {
  const sidePanelHeaderActionsElement = useAtomStateValue(
    sidePanelHeaderActionsElementState,
  );
  const sidePanelHeaderTitleSuffixElement = useAtomStateValue(
    sidePanelHeaderTitleSuffixElementState,
  );
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const [paginationContainer, setPaginationContainer] =
    useState<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const bodyRef = useRef<HTMLDivElement>(null);

  const [debouncedSearch] = useDebounce(search.trim(), 200);
  const searchRef = useRef<HTMLInputElement>(null);
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
  const { count, loading, error } = useStatusBoardCount({
    objectNameSingular: sheet.objectNameSingular,
    filter,
  });

  useEffect(() => {
    const previousFocus = document.activeElement;
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <StyledStatusBoardSheet
      ref={dialogRef}
      role="dialog"
      aria-label={sheet.title}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {sidePanelHeaderTitleSuffixElement &&
        createPortal(
          <StyledStatusBoardSheetCount>
            {loading
              ? '…'
              : error
                ? '조회 실패'
                : (sheet.summary ?? `${count}건`)}
          </StyledStatusBoardSheetCount>,
          sidePanelHeaderTitleSuffixElement,
        )}
      {sidePanelHeaderActionsElement &&
        sheet.listTarget &&
        createPortal(
          <StyledStatusBoardSheetListLink
            aria-label="필터 적용된 전체 목록 보기"
            title="필터 적용된 전체 목록 보기"
            to={buildStatusBoardListUrl({
              objectMetadataItem: sheet.listTarget.objectMetadataItem,
              viewId: sheet.listTarget.viewId,
              filter,
            })}
            onClick={onClose}
          >
            필터 적용된 전체 목록 보기
            <IconArrowUpRight size={16} aria-hidden />
          </StyledStatusBoardSheetListLink>,
          sidePanelHeaderActionsElement,
        )}
      <StyledStatusBoardSheetToolbar>
        <StyledStatusBoardModalSearch
          role="search"
          aria-label={`${sheet.title} 검색`}
        >
          <IconSearch size={20} aria-hidden />
          <StyledStatusBoardModalSearchInput
            ref={searchRef}
            type="search"
            aria-label="목록 검색"
            placeholder={`${sheet.title}에서 이름으로 검색`}
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search.length > 0 && (
            <StyledStatusBoardSearchClear
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setSearch('');
                searchRef.current?.focus();
              }}
            >
              <IconX size={16} aria-hidden />
            </StyledStatusBoardSearchClear>
          )}
        </StyledStatusBoardModalSearch>
        <StyledStatusBoardSort role="group" aria-label="목록 정렬">
          <Select
            dropdownId="status-board-sheet-sort"
            dropdownWidthAuto
            fullWidth
            needIconCheck
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: '최신 등록순' },
              { value: 'oldest', label: '오래된 등록순' },
            ]}
          />
        </StyledStatusBoardSort>
      </StyledStatusBoardSheetToolbar>
      <StyledStatusBoardSheetBody ref={bodyRef}>
        <StatusBoardRecordList
          key={JSON.stringify({ filter, sort })}
          paginated
          paginationContainer={paginationContainer}
          onOpenRecord={(recordId) =>
            openRecordInSidePanel({
              recordId,
              objectNameSingular: sheet.objectNameSingular,
            })
          }
          onPageChange={() => bodyRef.current?.scrollTo({ top: 0 })}
          orderBy={[
            {
              createdAt: sort === 'newest' ? 'DescNullsLast' : 'AscNullsLast',
            },
            { id: 'AscNullsLast' },
          ]}
          objectNameSingular={sheet.objectNameSingular}
          filter={filter}
          recordGqlFields={sheet.recordGqlFields}
          recordBadges={sheet.recordBadges}
          recordMembers={sheet.recordMembers}
          emptyLabel={
            search.trim() ? '검색 결과가 없어요' : '해당하는 항목이 없어요'
          }
          emptyVariant={search.trim() ? 'search' : 'document'}
          emptyDescription={
            search.trim()
              ? '이름을 확인하거나 다른 검색어로 찾아보세요.'
              : undefined
          }
        />
      </StyledStatusBoardSheetBody>
      <div ref={setPaginationContainer} style={{ flexShrink: 0 }} />
    </StyledStatusBoardSheet>
  );
};
