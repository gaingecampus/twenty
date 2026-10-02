import {
  StyledDashboardSection,
  StyledDashboardMuted,
  type DashboardTone,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { StyledControlContainer } from '@/ui/input/components/SelectControl';
import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledStatusBoardPeriodControls = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const StyledStatusBoardPeriodNav = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border-radius: 10px;
  display: inline-flex;
  gap: 2px;
  padding: 4px;
`;

export const StyledStatusBoardPeriodNavButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  font-size: 15px;
  height: 32px;
  justify-content: center;
  width: 32px;

  &:hover:not(:disabled) {
    background: ${themeCssVariables.background.primary};
    color: ${themeCssVariables.font.color.primary};
  }

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }
`;

export const StyledStatusBoardPeriodLabel = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: 14px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 100px;
  text-align: center;
`;

export const StyledStatusBoardSegment = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: 10px;
  display: inline-flex;
  padding: 4px;
`;

export const StyledStatusBoardSegmentButton = styled.button<{
  isActive: boolean;
}>`
  background: ${({ isActive }) =>
    isActive ? themeCssVariables.background.primary : 'transparent'};
  border: none;
  border-radius: 8px;
  box-shadow: ${({ isActive }) =>
    isActive ? themeCssVariables.boxShadow.light : 'none'};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: 13px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-height: 32px;
  min-width: 42px;
  padding: 6px 12px;
`;

export const StyledStatusBoardRowList = styled.div<{
  hideSeparators?: boolean;
}>`
  display: flex;
  flex-direction: column;
  && > a + a,
  && > div + div {
    border-top: ${({ hideSeparators }) =>
      hideSeparators
        ? 'none'
        : `1px solid ${themeCssVariables.border.color.light}`};
  }
`;

const statusBoardRowBase = `
  align-items: center;
  border-radius: 0;
  color: inherit;
  display: flex;
  gap: 14px;
  padding: 12px 8px;
  text-decoration: none;
  transition: background 0.12s;

  & + & {
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }
`;

export const StyledStatusBoardRowLink = styled(Link)`
  ${statusBoardRowBase}
  cursor: pointer;

  &:hover {
    background: ${themeCssVariables.background.secondary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: -2px;
  }
`;

export const StyledStatusBoardRow = styled.div`
  ${statusBoardRowBase}
`;

export const StyledStatusBoardRowBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StyledStatusBoardRowName = styled.div`
  font-size: 15px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledStatusBoardRowCaption = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 13px;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledStatusBoardCumulativeGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  @container (max-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @container (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StyledStatusBoardGroupTitle = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 13px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 14px 4px 4px;

  &:first-child {
    padding-top: 4px;
  }
`;

export const StyledStatusBoardContractSection = styled(StyledDashboardSection)`
  height: 400px;
  overflow: hidden;
  > * {
    flex-shrink: 0;
  }
  > div:last-child {
    flex-shrink: 1;
  }
`;

export const StyledStatusBoardEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 10px;
  padding: 28px 4px 24px;
  text-align: center;
`;

export const StyledStatusBoardMoreButton = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: none;
  border-radius: 12px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: 13px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 6px 0 4px;
  padding: 9px;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

export const StyledStatusBoardSheet = styled.div`
  background: ${themeCssVariables.background.primary};
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  width: 100%;
`;

export const StyledStatusBoardSheetHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

export const StyledStatusBoardSheetCount = styled(StyledDashboardMuted)`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

export const StyledStatusBoardSheetCloseButton = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: none;
  border-radius: 50%;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  flex: none;
  font-size: 16px;
  height: 32px;
  margin-left: auto;
  width: 32px;
`;

export const StyledStatusBoardWeekWrap = styled.div`
  margin: 0 -4px;
  overflow-x: auto;
  padding: 0 4px;
`;

export const StyledStatusBoardWeekGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 828px;
`;

export const StyledStatusBoardWeekRow = styled.div`
  align-items: stretch;
  display: grid;
  gap: 8px;
  grid-template-columns: 180px repeat(6, minmax(100px, 1fr));

  @media (max-width: 640px) {
    gap: 6px;
    grid-template-columns: 160px repeat(6, minmax(100px, 1fr));
  }
`;

export const StyledStatusBoardWeekHeaderCell = styled.div<{
  isToday?: boolean;
}>`
  color: ${({ isToday }) =>
    isToday === true
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.tertiary};
  font-size: 12px;
  font-weight: ${({ isToday }) =>
    isToday === true
      ? themeCssVariables.font.weight.semiBold
      : themeCssVariables.font.weight.medium};
  text-align: center;

  &:first-child {
    text-align: left;
  }
`;

export const StyledStatusBoardWeekWho = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: 2px;
  justify-content: center;
  min-width: 0;
`;

export const StyledStatusBoardWeekWhoName = styled.div`
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

export const StyledStatusBoardWeekWhoMeta = styled.small`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 11.5px;
  font-weight: ${themeCssVariables.font.weight.regular};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledStatusBoardWeekCell = styled.div<{
  isToday?: boolean;
  hasVisit?: boolean;
  cadence?: 'WEEKLY' | 'BIWEEKLY' | 'OTHER';
}>`
  background: ${({ hasVisit }) =>
    hasVisit === true ? themeCssVariables.background.secondary : 'transparent'};
  border: 1px
    ${({ hasVisit }) => (hasVisit === true ? 'solid transparent' : 'dashed')}
    ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  gap: 4px;
  justify-content: center;
  line-height: 1.3;
  min-height: 58px;
  outline: ${({ isToday }) =>
    isToday === true
      ? `2px solid ${themeCssVariables.border.color.blue}`
      : 'none'};
  outline-offset: -2px;
  padding: 6px 8px;
`;

export const StyledStatusBoardWeekCellLink = styled.a`
  border-radius: 8px;
  color: inherit;
  display: block;
  min-width: 0;
  text-decoration: none;

  &:hover b {
    text-decoration: underline;
  }
`;

export const StyledStatusBoardWeekCellBlock = styled.div`
  display: block;
  min-width: 0;
`;

export const StyledStatusBoardWeekCellTitle = styled.b<{
  cadence?: 'WEEKLY' | 'BIWEEKLY' | 'OTHER';
}>`
  color: ${({ cadence }) => {
    if (cadence === 'BIWEEKLY') {
      return themeCssVariables.color.orange;
    }

    return themeCssVariables.color.blue;
  }};
  display: block;
  font-size: 12.5px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledStatusBoardWeekCellMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: block;
  font-size: 11px;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledStatusBoardWeekNote = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 12.5px;
  margin-top: 8px;
`;

export const StyledStatusBoardRowAside = styled.div`
  flex: none;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  text-align: right;
`;

export const StyledStatusBoardTag = styled.span<{ tone?: DashboardTone }>`
  background: ${({ tone }) =>
    tone === 'orange'
      ? themeCssVariables.background.transparent.orange
      : themeCssVariables.background.secondary};
  border-radius: 6px;
  color: ${({ tone }) =>
    tone === 'orange'
      ? themeCssVariables.color.orange
      : themeCssVariables.font.color.secondary};
  display: inline-block;
  font-size: 12px;
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 3px 8px;
`;

export const StyledStatusBoardContract = styled.div`
  min-width: 0;
  width: 100%;
`;

export const StyledStatusBoardContractTop = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
`;

export const StyledStatusBoardContractMeta = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 6px 12px;
  margin: 8px 0 0 36px;
  > span {
    background: transparent;
    padding: 0;
  }
`;

export const StyledStatusBoardProgress = styled.progress`
  appearance: none;
  background: ${themeCssVariables.background.tertiary};
  border: none;
  border-radius: 3px;
  display: block;
  height: 3px;
  margin-left: 36px;
  margin-top: 10px;
  overflow: hidden;
  width: calc(100% - 36px);

  &::-webkit-progress-bar {
    background: ${themeCssVariables.background.tertiary};
  }
  &::-webkit-progress-value {
    background: ${themeCssVariables.color.blue};
    border-radius: 3px;
  }
  &::-moz-progress-bar {
    background: ${themeCssVariables.color.blue};
  }
`;

export const StyledStatusBoardSheetBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding-right: 12px;

  > [data-status-board-empty] {
    box-sizing: border-box;
    flex: 1;
    justify-content: center;
  }
`;

export const StyledStatusBoardSearch = styled.input`
  background: ${themeCssVariables.background.secondary};
  border: none;
  border-radius: 12px;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  margin: 12px 0 8px;
  padding: 10px 14px;
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
  }
`;

export const StyledStatusBoardWeekSection = styled(StyledDashboardSection)`
  [data-week-header-controls] {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    justify-content: flex-end;
    margin-left: auto;
  }

  [data-week-header-controls] > div {
    margin-top: 0;
  }

  [data-week-header-controls] > label {
    align-items: center;
    display: inline-flex;
    gap: ${themeCssVariables.spacing[1]};
  }

  [data-week-header-controls] > label > input {
    margin: 0;
  }
`;

export const StyledStatusBoardModalSearch = styled.div`
  align-items: center;
  background: var(--t-search-bg);
  border: 1px solid var(--t-search-border-color);
  border-radius: var(--t-search-radius);
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  margin: 16px 0 12px;
  min-height: var(--t-search-height);
  padding: 0 12px;

  &:focus-within {
    background: var(--t-search-focus-bg);
    border-color: ${themeCssVariables.color.blue};
    box-shadow: var(--t-search-focus-ring);
    outline: none;
  }

  > svg {
    flex-shrink: 0;
  }
`;

export const StyledStatusBoardModalSearchInput = styled.input`
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font: inherit;
  font-size: 14px;
  min-width: 0;
  outline: none;
  padding: 0;

  &::placeholder {
    color: ${themeCssVariables.font.color.secondary};
    opacity: 1;
  }

  &::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }
`;

export const StyledStatusBoardSearchClear = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border: none;
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: 28px;
  justify-content: center;
  padding: 0;
  width: 28px;

  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

export const StyledStatusBoardSheetFooter = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding-top: 16px;
`;

export const StyledStatusBoardSheetListLink = styled(Link)`
  align-items: center;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  height: 32px;
  justify-content: center;
  padding: 0 ${themeCssVariables.spacing[2]};
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

export const StyledStatusBoardContractBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
`;

export const StyledStatusBoardWeekIdentity = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 8px;
  min-width: 0;
  > :first-child {
    flex-shrink: 0;
  }
`;

export const StyledStatusBoardCadenceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;
export const StyledStatusBoardCadenceBadge = styled.span<{ cadence?: string }>`
  background: ${({ cadence }) =>
    cadence === 'WEEKLY'
      ? themeCssVariables.background.transparent.blue
      : cadence === 'BIWEEKLY'
        ? themeCssVariables.background.transparent.orange
        : cadence === 'MONTHLY'
          ? themeCssVariables.background.transparent.success
          : themeCssVariables.background.tertiary};
  border-radius: 4px;
  color: ${({ cadence }) =>
    cadence === 'WEEKLY'
      ? themeCssVariables.color.blue
      : cadence === 'BIWEEKLY'
        ? themeCssVariables.color.orange
        : cadence === 'MONTHLY'
          ? themeCssVariables.color.green
          : themeCssVariables.font.color.secondary};
  display: inline-block;
  font-size: 11px;
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1.5;
  padding: 2px 6px;
  white-space: nowrap;
`;

export const StyledStatusBoardSheetActions = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  margin-left: auto;
`;
export const StyledStatusBoardSheetToolbar = styled.div`
  align-items: stretch;
  display: grid;
  flex-shrink: 0;
  gap: 12px;
  grid-template-columns: minmax(0, 3fr) minmax(128px, 1fr);
  margin: 0 0 12px;

  > div {
    box-sizing: border-box;
    height: var(--t-search-height);
    margin: 0;
    min-height: 0;
    min-width: 0;
  }
`;

export const StyledStatusBoardSort = styled.div`
  min-width: 0;

  ${StyledControlContainer} {
    background: var(--t-toolbar-chip-bg);
    border: var(--t-toolbar-chip-border);
    border-radius: var(--t-toolbar-chip-radius);
    font-size: var(--t-toolbar-chip-font-size);
    font-weight: var(--t-toolbar-chip-font-weight);
    height: var(--t-search-height);
    padding: 0 12px;
  }

  &:focus-within {
    ${StyledControlContainer} {
      border-color: ${themeCssVariables.border.color.blue};
    }
  }

  :focus-visible {
    outline: none;
  }
`;
export const StyledStatusBoardPagination = styled.nav`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  bottom: 0;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: 13px;
  gap: 8px;
  padding: 12px 0 0;
  position: sticky;
  > span:first-child {
    margin-right: auto;
  }
`;

export const StyledStatusBoardContractLabels = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: 6px;
`;

export const StyledStatusBoardRowBadge = styled(StyledStatusBoardTag)`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
`;

export const StyledStatusBoardPageButton = styled(
  StyledStatusBoardPeriodNavButton,
)<{ isActive?: boolean }>`
  background: ${({ isActive }) =>
    isActive === true ? themeCssVariables.background.secondary : 'transparent'};
  color: ${({ isActive }) =>
    isActive === true
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  font-weight: ${({ isActive }) =>
    isActive === true
      ? themeCssVariables.font.weight.semiBold
      : themeCssVariables.font.weight.regular};
  min-width: 32px;
  padding: 0 6px;
  width: auto;
`;

export const StyledStatusBoardPageGap = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  text-align: center;
  width: 20px;
`;

export const StyledStatusBoardAvatarStack = styled.span`
  align-items: center;
  display: inline-flex;
  flex-shrink: 0;
  gap: 2px;
`;
