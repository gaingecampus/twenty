import { useId } from 'react';
import { RECORD_INDEX_PAGE_SIZE_OPTIONS } from '@/object-record/record-index/constants/RecordIndexPageSizeOptions';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { StyledHeaderDropdownButton } from '@/ui/layout/dropdown/components/StyledHeaderDropdownButton';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { MenuItemSelect } from 'twenty-ui/navigation';
import { StyledFieldContractControls } from './fieldManagementStyled';

export const FIELD_CONTRACT_SORT_OPTIONS = [
  { value: 'default', label: '기본 순서' },
  { value: 'name', label: '계약명순' },
  { value: 'start', label: '계약 시작일 최신순' },
  { value: 'end', label: '계약 종료일 임박순' },
] as const;
export type FieldContractSort =
  (typeof FIELD_CONTRACT_SORT_OPTIONS)[number]['value'];

export const FIELD_CONTRACT_FILTER_OPTIONS = [
  { value: 'all', label: '전체 계약' },
  { value: 'okr', label: 'OKR 미설정' },
  { value: 'sessions', label: '총 회차 미설정' },
] as const;
export type FieldContractFilter =
  (typeof FIELD_CONTRACT_FILTER_OPTIONS)[number]['value'];

export const FieldContractListControls = ({
  search,
  onSearchChange,
  pageSize,
  filter,
  onFilterChange,
  sort,
  onPageSizeChange,
  onSortChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FieldContractFilter;
  onFilterChange: (value: FieldContractFilter) => void;
  pageSize: number;
  sort: FieldContractSort;
  onPageSizeChange: (value: number) => void;
  onSortChange: (value: FieldContractSort) => void;
}) => {
  const id = useId();
  const { closeDropdown } = useCloseDropdown();
  return (
    <StyledFieldContractControls
      data-contract-list-controls
      aria-label="계약 목록 표시 설정"
    >
      <input
        type="search"
        aria-label="계약 검색"
        placeholder="계약 검색"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div data-contract-list-actions>
        <Dropdown
          dropdownId={`${id}-size`}
          clickableComponent={
            <StyledHeaderDropdownButton aria-label="한 번에 보이는 계약 개수">
              {pageSize}개씩 보기
            </StyledHeaderDropdownButton>
          }
          dropdownComponents={
            <DropdownContent>
              <DropdownMenuItemsContainer>
                {RECORD_INDEX_PAGE_SIZE_OPTIONS.map((value) => (
                  <MenuItemSelect
                    key={value}
                    text={`${value}개씩 보기`}
                    selected={pageSize === value}
                    onClick={() => {
                      onPageSizeChange(value);
                      closeDropdown(`${id}-size`);
                    }}
                  />
                ))}
              </DropdownMenuItemsContainer>
            </DropdownContent>
          }
        />
        <Dropdown
          dropdownId={`${id}-sort`}
          clickableComponent={
            <StyledHeaderDropdownButton aria-label="계약 정렬">
              정렬 ·{' '}
              {
                FIELD_CONTRACT_SORT_OPTIONS.find(
                  (option) => option.value === sort,
                )?.label
              }
            </StyledHeaderDropdownButton>
          }
          dropdownComponents={
            <DropdownContent>
              <DropdownMenuItemsContainer>
                {FIELD_CONTRACT_SORT_OPTIONS.map(({ value, label }) => (
                  <MenuItemSelect
                    key={value}
                    text={label}
                    selected={sort === value}
                    onClick={() => {
                      onSortChange(value);
                      closeDropdown(`${id}-sort`);
                    }}
                  />
                ))}
              </DropdownMenuItemsContainer>
            </DropdownContent>
          }
        />
        <Dropdown
          dropdownId={`${id}-filter`}
          clickableComponent={
            <StyledHeaderDropdownButton
              aria-label="계약 필터"
              isActive={filter !== 'all'}
            >
              필터
              {filter !== 'all'
                ? ` · ${FIELD_CONTRACT_FILTER_OPTIONS.find((option) => option.value === filter)?.label}`
                : ''}
            </StyledHeaderDropdownButton>
          }
          dropdownComponents={
            <DropdownContent>
              <DropdownMenuItemsContainer>
                {FIELD_CONTRACT_FILTER_OPTIONS.map(({ value, label }) => (
                  <MenuItemSelect
                    key={value}
                    text={label}
                    selected={filter === value}
                    onClick={() => {
                      onFilterChange(value);
                      closeDropdown(`${id}-filter`);
                    }}
                  />
                ))}
              </DropdownMenuItemsContainer>
            </DropdownContent>
          }
        />
      </div>
    </StyledFieldContractControls>
  );
};
