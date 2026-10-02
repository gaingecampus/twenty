import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type DashboardTone = 'red' | 'blue' | 'green' | 'orange' | 'default';

export const StyledDashboardScroll = styled.div`
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

export const StyledDashboardSection = styled.section`
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

export const StyledDashboardSectionTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: 18px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: -0.01em;
  margin: 0;
`;

export const StyledDashboardSectionHeader = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: space-between;
  margin-bottom: 0;
`;

export const StyledDashboardMuted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 13px;
`;

export const StyledDashboardKpiGrid = styled.div<{ columns?: number }>`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(
    ${({ columns }) => columns ?? 4},
    minmax(0, 1fr)
  );
  @container (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StyledDashboardKpiButton = styled.button<{
  tone?: DashboardTone;
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

export const StyledDashboardKpiLabel = styled.div<{ tone?: DashboardTone }>`
  align-items: center;
  align-self: center;
  color: ${({ tone }) =>
    tone && tone !== 'default'
      ? themeCssVariables.color[tone]
      : themeCssVariables.font.color.secondary};
  display: flex;
  font-size: 14px;
  [data-kpi-info] {
    cursor: help;
    display: inline-flex;
    flex-shrink: 0;
  }
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: 6px;
`;

export const StyledDashboardKpiValue = styled.div<{
  tone?: DashboardTone;
  isEmpty?: boolean;
}>`
  color: ${({ tone, isEmpty }) => {
    if (isEmpty) return themeCssVariables.font.color.light;
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

export const StyledDashboardKpiSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 13px;
  grid-column: 1 / -1;
  line-height: 1.4;
  margin-top: 6px;
`;

export const StyledDashboardChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--t-view-tab-gap, 4px);
  min-width: 0;
  overflow-x: auto;
  padding: 0;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const StyledDashboardChip = styled.button<{
  isActive: boolean;
  variant?: 'default' | 'soft';
}>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.background.primary};
  border: ${({ isActive }) =>
    isActive
      ? `1px solid ${themeCssVariables.font.color.primary}`
      : `1px solid ${themeCssVariables.border.color.medium}`};
  border-radius: var(--t-view-tab-radius, 6px);
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.inverted
      : 'var(--t-view-tab-color)'};
  cursor: pointer;
  display: inline-flex;
  flex: none;
  font-size: var(--t-view-tab-font-size, 14px);
  font-weight: ${({ isActive }) =>
    isActive ? 'var(--t-view-tab-active-weight)' : 'var(--t-view-tab-weight)'};
  gap: 6px;
  min-height: var(--t-view-tab-height, 36px);
  padding: 0 var(--t-view-tab-padding-x, 10px);
  white-space: nowrap;

  [data-selected-member] {
    --t-font-color-primary: ${themeCssVariables.font.color.inverted};
    --t-font-color-secondary: ${themeCssVariables.font.color.inverted};
  }

  &:hover {
    background: ${({ isActive }) =>
      isActive
        ? themeCssVariables.font.color.primary
        : 'var(--t-view-tab-hover-bg)'};
  }

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }
`;

export const StyledDashboardSoftTab = styled.button<{ isActive: boolean }>`
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

export const StyledDashboardCumulativeButton = styled.button`
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

export const StyledDashboardCumulativeValue = styled(StyledDashboardKpiValue)`
  align-self: flex-start;
  text-align: left;
`;

export const StyledDashboardCumulativeLabel = styled(StyledDashboardKpiLabel)`
  align-items: center;
  align-self: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  svg {
    flex-shrink: 0;
  }
`;

export const StyledDashboardRowAvatar = styled.div<{
  tone?: DashboardTone;
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

export const StyledDashboardKpiIcon = styled(StyledDashboardRowAvatar)`
  background: ${({ tone }) =>
    tone === 'blue'
      ? themeCssVariables.background.transparent.blue
      : tone === 'green'
        ? themeCssVariables.background.transparent.success
        : tone === 'red'
          ? themeCssVariables.background.transparent.danger
          : tone === 'orange'
            ? themeCssVariables.background.transparent.orange
            : themeCssVariables.background.tertiary};
  border-radius: 6px;
  grid-column: 1;
  grid-row: 1;
  height: 24px;
  width: 24px;
`;

export const StyledDashboardToolbar = styled.div`
  background: transparent;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
`;

export const StyledDashboardContractTabs = styled.div`
  background: ${themeCssVariables.background.tertiary};
  &[data-on-page-canvas] {
    background: ${themeCssVariables.background.quaternary};
  }
  border-radius: 10px;
  display: flex;
  padding: 4px;
`;

export const StyledDashboardTabCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: inline-block;
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
  text-align: right;
`;
