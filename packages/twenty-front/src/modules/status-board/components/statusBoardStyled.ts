import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type StatusBoardTone = 'red' | 'blue' | 'green' | 'orange' | 'default';

export const StyledStatusBoardScroll = styled.div`
  background: var(--t-app-bg, ${themeCssVariables.background.tertiary});
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;

  > * {
    box-sizing: border-box;
    flex-shrink: 0;
    margin-left: auto;
    margin-right: auto;
    max-width: 1232px;
    width: 100%;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
  overflow: auto;
  overflow-anchor: none;
  padding: 20px 24px 48px;
  scrollbar-gutter: stable;

  @media (max-width: 640px) {
    padding: 16px 12px 40px;
  }
`;

export const StyledStatusBoardSection = styled.section`
  background: ${themeCssVariables.background.primary};
  border-radius: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 24px 26px;

  @media (max-width: 640px) {
    border-radius: 20px;
    padding: 20px 16px 22px;
  }
`;

export const StyledStatusBoardSectionTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: 18px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: -0.01em;
  margin: 0;
`;

export const StyledStatusBoardSectionHeader = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: space-between;
  margin-bottom: 0;
`;

export const StyledStatusBoardMuted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 13px;
`;

export const StyledStatusBoardKpiGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  @container (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StyledStatusBoardKpiButton = styled.button<{
  tone?: StatusBoardTone;
  to?: string;
}>`
  align-content: start;
  background: ${themeCssVariables.background.secondary};
  border: none;
  border-radius: 12px;
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: 24px minmax(0, 1fr);
  min-height: 108px;
  min-width: 0;
  padding: 16px;
  text-align: left;
  text-decoration: none;
  transition: background 0.12s;
  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

export const StyledStatusBoardKpiLabel = styled.div`
  align-self: center;
  color: ${themeCssVariables.font.color.secondary};
  font-size: 14px;
  font-weight: ${themeCssVariables.font.weight.medium};
`;

export const StyledStatusBoardKpiValue = styled.div<{
  tone?: StatusBoardTone;
  isEmpty?: boolean;
}>`
  color: ${({ tone, isEmpty }) => {
    if (isEmpty) return themeCssVariables.font.color.tertiary;
    if (tone === 'red') {
      return themeCssVariables.color.red;
    }

    if (tone === 'blue') {
      return themeCssVariables.color.blue;
    }

    if (tone === 'green') {
      return themeCssVariables.color.green;
    }

    if (tone === 'orange') {
      return themeCssVariables.color.orange;
    }

    return themeCssVariables.font.color.primary;
  }};
  font-size: clamp(22px, 3.5cqw, 28px);
  font-variant-numeric: tabular-nums;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  small {
    font-size: 14px;
    font-weight: 500;
    margin-left: 3px;
  }
  grid-column: 1 / -1;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-top: 4px;
  white-space: nowrap;
`;

export const StyledStatusBoardKpiSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 13px;
  grid-column: 1 / -1;
  line-height: 1.4;
  margin-top: 6px;
`;

export const StyledStatusBoardChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
  padding: 2px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const StyledStatusBoardChip = styled.button<{
  isActive: boolean;
  variant?: 'default' | 'soft';
}>`
  background: ${({ isActive, variant }) => {
    if (isActive !== true) {
      return themeCssVariables.background.primary;
    }

    if (variant === 'soft') {
      return themeCssVariables.background.transparent.blue;
    }

    return themeCssVariables.font.color.primary;
  }};
  border: 1px solid
    ${({ isActive, variant }) => {
      if (isActive === true && variant !== 'soft') {
        return themeCssVariables.font.color.primary;
      }

      return themeCssVariables.border.color.medium;
    }};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ isActive, variant }) => {
    if (isActive !== true) {
      return themeCssVariables.font.color.secondary;
    }

    if (variant === 'soft') {
      return themeCssVariables.color.blue;
    }

    return themeCssVariables.font.color.inverted;
  }};
  cursor: pointer;
  flex: none;
  font-size: 14px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-height: 32px;
  padding: 6px 10px;
  white-space: nowrap;

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }
`;

export const StyledStatusBoardSoftTab = styled.button<{ isActive: boolean }>`
  align-items: center;
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
  display: flex;
  flex: 1;
  font-size: 13px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: 6px;
  justify-content: center;
  min-height: 40px;
  min-width: 0;
  padding: 8px;
  white-space: nowrap;
  &:hover {
    color: ${themeCssVariables.color.blue};
  }
`;

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
      hideSeparators ? 'none' : undefined};
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

export const StyledStatusBoardRowAvatar = styled.div<{
  tone?: StatusBoardTone;
}>`
  align-items: center;
  background: ${({ tone }) => {
    if (tone === 'red') {
      return themeCssVariables.background.transparent.danger;
    }

    if (tone === 'blue') {
      return themeCssVariables.background.transparent.blue;
    }

    if (tone === 'green') {
      return themeCssVariables.background.transparent.success;
    }

    if (tone === 'orange') {
      return themeCssVariables.background.transparent.orange;
    }

    return themeCssVariables.background.secondary;
  }};
  border-radius: 14px;
  color: ${({ tone }) => {
    if (tone === 'red') {
      return themeCssVariables.color.red;
    }

    if (tone === 'blue') {
      return themeCssVariables.color.blue;
    }

    if (tone === 'green') {
      return themeCssVariables.color.green;
    }

    if (tone === 'orange') {
      return themeCssVariables.color.orange;
    }

    return themeCssVariables.font.color.tertiary;
  }};
  display: grid;
  flex: none;
  font-size: 13px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: 40px;
  place-items: center;
  width: 40px;
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

export const StyledStatusBoardCumulativeButton = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: none;
  border-radius: 10px;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 16px;
  text-align: left;
  transition: background 0.12s;
  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

export const StyledStatusBoardCumulativeValue = styled.div<{
  isEmpty?: boolean;
}>`
  color: ${({ isEmpty }) =>
    isEmpty
      ? themeCssVariables.font.color.tertiary
      : themeCssVariables.font.color.primary};
  font-size: 24px;
  font-variant-numeric: tabular-nums;
  small {
    font-size: 13px;
    font-weight: 500;
    margin-left: 3px;
  }
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: -0.02em;
  line-height: 1.1;
  white-space: nowrap;
`;

export const StyledStatusBoardCumulativeLabel = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 13px;
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-top: 4px;
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

export const StyledStatusBoardContractSection = styled(
  StyledStatusBoardSection,
)`
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

export const StyledStatusBoardSheetBackdrop = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.primary};
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 24px;
  position: fixed;
  z-index: 50;

  @media (max-width: 640px) {
    align-items: flex-end;
    padding: 0;
  }
`;

export const StyledStatusBoardSheet = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: 24px;
  box-shadow: ${themeCssVariables.boxShadow.strong};
  display: flex;
  flex-direction: column;
  max-height: min(80vh, 760px);
  max-width: 720px;
  padding: 20px 24px 20px;
  width: 100%;

  @media (max-width: 640px) {
    border-radius: 24px 24px 0 0;
    max-height: 88vh;
    padding: 20px;
  }
`;

export const StyledStatusBoardSheetHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

export const StyledStatusBoardSheetCount = styled(StyledStatusBoardMuted)`
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
  min-width: 560px;
`;

export const StyledStatusBoardWeekRow = styled.div`
  align-items: stretch;
  display: grid;
  gap: 8px;
  grid-template-columns: 180px repeat(5, 1fr);

  @media (max-width: 640px) {
    gap: 6px;
    grid-template-columns: 160px repeat(5, 1fr);
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledStatusBoardWeekNote = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 12.5px;
  margin-top: 8px;
`;

export const StyledStatusBoardKpiIcon = styled(StyledStatusBoardRowAvatar)`
  border-radius: 6px;
  grid-column: 1;
  grid-row: 1;
  height: 24px;
  width: 24px;
`;

export const StyledStatusBoardRowAside = styled.div`
  flex: none;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  text-align: right;
`;

export const StyledStatusBoardTag = styled.span<{ tone?: StatusBoardTone }>`
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

export const StyledStatusBoardToolbar = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
`;

export const StyledStatusBoardSheetBody = styled.div`
  min-height: 0;
  overflow-y: auto;
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

export const StyledStatusBoardWeekSection = StyledStatusBoardSection;

export const StyledStatusBoardModalSearch = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  margin: 16px 0 12px;
  min-height: 46px;
  padding: 0 12px;

  &:focus-within {
    border-color: ${themeCssVariables.border.color.blue};
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
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
  padding: 12px 0;

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
  background: ${themeCssVariables.background.transparent.blue};
  border: 1px solid ${themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.color.blue};
  display: inline-flex;
  font-size: 14px;
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  text-decoration: none;

  &:hover {
    background: ${themeCssVariables.accent.secondary};
  }
`;

export const StyledStatusBoardTabCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: inline-block;
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
  text-align: right;
`;

export const StyledStatusBoardContractTabs = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: 10px;
  display: flex;
  padding: 4px;
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
