import { StatusBoardKpiIcon } from '@/status-board/components/StatusBoardKpiIcon';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildStatusBoardListUrl } from '@/status-board/utils/buildStatusBoardListUrl';
import { IconSearch, IconX, IconList, useIcons } from 'twenty-ui/icon';
import { useEffect, useId, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { useStatusBoardCount } from '@/status-board/hooks/useStatusBoardCount';
import {
  type StatusBoardTone,
  StyledStatusBoardSheetHeader,
  StyledStatusBoardSheetActions,
  StyledStatusBoardSort,
  StyledStatusBoardSheetToolbar,
  StyledStatusBoardSheetListLink,
  StyledStatusBoardSheetCount,
  StyledStatusBoardSectionTitle,
  StyledStatusBoardSheet,
  StyledStatusBoardSheetBackdrop,
  StyledStatusBoardSheetCloseButton,
  StyledStatusBoardSheetBody,
  StyledStatusBoardModalSearch,
  StyledStatusBoardModalSearchInput,
  StyledStatusBoardSearchClear,
} from '@/status-board/components/statusBoardStyled';
import { StatusBoardRecordList } from '@/status-board/components/StatusBoardRecordList';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export type StatusBoardSheetState = {
  kpiLabel?: string;
  tone?: StatusBoardTone;
  listTarget?: {
    objectMetadataItem: EnrichedObjectMetadataItem;
    viewId?: string;
  };
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
  const [sort, setSort] = useState('newest');
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: sheet.objectNameSingular,
  });
  const { getIcon } = useIcons();
  const HeaderIcon = getIcon(objectMetadataItem.icon);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [debouncedSearch] = useDebounce(search.trim(), 200);
  const titleId = useId();
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
            'button:not(:disabled), input, select, a[href]',
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
        <StyledStatusBoardSheetHeader>
          {sheet.kpiLabel ? (
            <StatusBoardKpiIcon label={sheet.kpiLabel} tone={sheet.tone} />
          ) : (
            <HeaderIcon size={20} aria-hidden />
          )}
          <StyledStatusBoardSectionTitle id={titleId}>
            {sheet.title}
          </StyledStatusBoardSectionTitle>
          <StyledStatusBoardSheetCount>
            {loading ? '…' : error ? '조회 실패' : `${count}건`}
          </StyledStatusBoardSheetCount>
          <StyledStatusBoardSheetActions>
            {sheet.listTarget && (
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
                <IconList size={18} aria-hidden />
              </StyledStatusBoardSheetListLink>
            )}
            <StyledStatusBoardSheetCloseButton
              type="button"
              aria-label="닫기"
              onClick={onClose}
            >
              ✕
            </StyledStatusBoardSheetCloseButton>
          </StyledStatusBoardSheetActions>
        </StyledStatusBoardSheetHeader>
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
          <StyledStatusBoardSort>
            <select
              aria-label="목록 정렬"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">최신 등록순</option>
              <option value="oldest">오래된 등록순</option>
            </select>
          </StyledStatusBoardSort>
        </StyledStatusBoardSheetToolbar>
        <StyledStatusBoardSheetBody ref={bodyRef}>
          <StatusBoardRecordList
            key={JSON.stringify({ filter, sort })}
            paginated
            totalCount={count}
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
      </StyledStatusBoardSheet>
    </StyledStatusBoardSheetBackdrop>
  );
};
