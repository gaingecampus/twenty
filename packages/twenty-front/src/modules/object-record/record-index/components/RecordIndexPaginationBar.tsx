import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useIsRecordIndexPaginationEnabled } from '@/object-record/record-index/hooks/useIsRecordIndexPaginationEnabled';
import { recordIndexCurrentPageComponentState } from '@/object-record/record-index/states/recordIndexCurrentPageComponentState';
import { recordIndexPageSizeState } from '@/object-record/record-index/states/recordIndexPageSizeState';
import { recordIndexTotalCountComponentState } from '@/object-record/record-index/states/recordIndexTotalCountComponentState';
import { getRecordIndexPageCount } from '@/object-record/record-index/utils/getRecordIndexPageCount';
import { getRecordIndexPaginationRange } from '@/object-record/record-index/utils/getRecordIndexPaginationRange';
import { getVisibleRecordIndexPageNumbers } from '@/object-record/record-index/utils/getVisibleRecordIndexPageNumbers';
import { StyledHeaderDropdownButton } from '@/ui/layout/dropdown/components/StyledHeaderDropdownButton';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledPaginationBar = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding-top: ${themeCssVariables.spacing[3]};
`;

const StyledRange = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: var(--t-toolbar-chip-font-size, ${themeCssVariables.font.size.sm});
  font-weight: var(
    --t-toolbar-chip-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
  white-space: nowrap;
`;

const StyledPageControls = styled.div`
  align-items: center;
  display: flex;
  gap: var(--t-toolbar-chip-gap, ${themeCssVariables.betweenSiblingsGap});
`;

const StyledPaginationButton = styled(StyledHeaderDropdownButton)`
  background: ${({ isActive }) =>
    isActive
      ? themeCssVariables.color.blue
      : `var(--t-toolbar-chip-bg, ${themeCssVariables.background.primary})`};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.secondary};
  justify-content: center;
  min-width: ${themeCssVariables.spacing[6]};

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }

  &:hover {
    background: ${({ isActive }) =>
      isActive
        ? themeCssVariables.color.blue10
        : `var(--t-toolbar-chip-hover-bg, ${themeCssVariables.background.transparent.light})`};
    color: ${({ isActive }) =>
      isActive
        ? themeCssVariables.font.color.inverted
        : themeCssVariables.font.color.secondary};
  }
`;

const StyledNavButton = styled(StyledPaginationButton)`
  gap: var(--t-button-gap, ${themeCssVariables.spacing[2]});
  min-width: unset;
  white-space: nowrap;
`;

const StyledEllipsis = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  padding: 0 ${themeCssVariables.spacing[1]};
`;

export const RecordIndexPaginationBar = () => {
  const isRecordIndexPaginationEnabled = useIsRecordIndexPaginationEnabled();

  const recordIndexPageSize = useAtomStateValue(recordIndexPageSizeState);

  const [recordIndexCurrentPage, setRecordIndexCurrentPage] =
    useAtomComponentState(recordIndexCurrentPageComponentState);

  const recordIndexTotalCount = useAtomComponentStateValue(
    recordIndexTotalCountComponentState,
  );

  const { formatNumber } = useNumberFormat();

  if (!isRecordIndexPaginationEnabled || recordIndexTotalCount === 0) {
    return null;
  }

  const pageCount = getRecordIndexPageCount(
    recordIndexTotalCount,
    recordIndexPageSize,
  );
  const { from, to } = getRecordIndexPaginationRange({
    page: recordIndexCurrentPage,
    pageSize: recordIndexPageSize,
    totalCount: recordIndexTotalCount,
  });
  const visiblePageNumbers = getVisibleRecordIndexPageNumbers(
    recordIndexCurrentPage,
    pageCount,
  );

  return (
    <StyledPaginationBar>
      <StyledRange>
        {t`${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(recordIndexTotalCount)} records`}
      </StyledRange>
      <StyledPageControls>
        <StyledNavButton
          disabled={recordIndexCurrentPage <= 1}
          onClick={() => setRecordIndexCurrentPage(recordIndexCurrentPage - 1)}
          type="button"
        >
          <IconChevronLeft size={16} />
          {t`Previous`}
        </StyledNavButton>
        {visiblePageNumbers.map((visiblePageNumber, index) =>
          visiblePageNumber === 'ellipsis' ? (
            <StyledEllipsis key={`ellipsis-${index}`}>…</StyledEllipsis>
          ) : (
            <StyledPaginationButton
              key={visiblePageNumber}
              isActive={visiblePageNumber === recordIndexCurrentPage}
              onClick={() => setRecordIndexCurrentPage(visiblePageNumber)}
              type="button"
            >
              {visiblePageNumber}
            </StyledPaginationButton>
          ),
        )}
        <StyledNavButton
          disabled={recordIndexCurrentPage >= pageCount}
          onClick={() => setRecordIndexCurrentPage(recordIndexCurrentPage + 1)}
          type="button"
        >
          {t`Next`}
          <IconChevronRight size={16} />
        </StyledNavButton>
      </StyledPageControls>
    </StyledPaginationBar>
  );
};
