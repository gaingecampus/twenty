import { StyledDashboardSection } from '@/ui/layout/dashboard/components/dashboardStyled';

import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
export const StyledFieldPanel = styled.div`
  color: ${theme.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  h2,
  h3,
  p {
    margin: 0;
  }
  p {
    line-height: 1.6;
    white-space: pre-wrap;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  input,
  textarea,
  select {
    background: ${theme.background.primary};
    border: 1px solid ${theme.border.color.medium};
    border-radius: 6px;
    box-sizing: border-box;
    color: inherit;
    font: inherit;
    padding: 10px;
    width: 100%;
  }
  textarea {
    min-height: 100px;
    resize: vertical;
  }
  button:not(
    [data-field-header] button,
    [data-record-header] button,
    [data-detail-toolbar] button,
    [data-goal-actions] button,
    button[data-goal-edit-overlay],
    button[data-dashboard-tab],
    [data-contract-pagination] button,
    [data-contract-list-controls] button
  ),
  a {
    font: inherit;
  }
  button:not(
    [data-field-header] button,
    [data-record-header] button,
    [data-detail-toolbar] button,
    [data-goal-actions] button,
    button[data-goal-edit-overlay],
    button[data-dashboard-tab],
    [data-contract-pagination] button,
    [data-contract-list-controls] button
  ) {
    background: ${theme.background.secondary};
    border: 1px solid ${theme.border.color.medium};
    border-radius: 6px;
    color: inherit;
    cursor: pointer;
    padding: 8px 12px;
  }
  button:not(
      [data-field-header] button,
      [data-record-header] button,
      [data-detail-toolbar] button,
      [data-goal-actions] button,
      button[data-goal-edit-overlay],
      button[data-dashboard-tab],
      [data-contract-pagination] button,
      [data-contract-list-controls] button
    )[aria-pressed='true'] {
    background: ${theme.background.tertiary};
    font-weight: 600;
  }
  button:not(
      [data-field-header] button,
      [data-record-header] button,
      [data-detail-toolbar] button,
      [data-goal-actions] button,
      button[data-goal-edit-overlay],
      button[data-dashboard-tab],
      [data-contract-pagination] button,
      [data-contract-list-controls] button
    ):disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  a {
    color: ${theme.font.color.primary};
  }
  &[data-contextual] {
    font-size: 14px;
  }
  &[data-contextual][data-contract-list-page] {
    display: flex;
    background: transparent;
    min-height: 0;
    padding: 0;
  }
  &[data-contextual][data-contract-list-page] > [data-contract-group] {
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  &[data-contextual][data-contract-list-page] [data-contract-item] {
    flex-shrink: 0;
    height: auto;
  }
  &&[data-inline-detail] {
    gap: 16px;
    padding: 0;
  }
  &&[data-inline-detail] > section {
    border: none;
    padding: 0;
  }
  &[data-writing]
    > :not([data-field-header]):not([data-field-editor]):not([role='status']) {
    display: none;
  }
  &[data-writing] [data-field-editor] {
    --field-editor-inset: 0px;
    background: ${theme.background.primary};
    border-radius: 0;
    padding: 0;
  }
  &[data-writing] [data-field-editor] > section {
    border: none;
    padding: 0;
  }
  &[data-contextual][data-writing]
    [data-field-editor]
    > section
    > :not([data-editor-actions]) {
    max-width: none;
  }
  &[data-contract-reading]
    > :not([data-contract-detail-group]):not([data-contract-detail]):not(
      [data-detail-toolbar]
    ):not([data-record-list]):not([data-field-header]):not(
      [data-field-editor]
    ):not([data-contract-picker]):not([role='status']) {
    display: none;
  }
  &[data-reading]
    > :not([data-record-list]):not([data-field-header]):not(
      [data-field-editor]
    ):not([data-contract-picker]):not([role='status']) {
    display: none;
  }
  [data-contract-detail] [data-inline-goal-editor] {
    border: none;
    margin: 0;
    padding: 0;
  }
  [data-contract-detail] [data-contract-title] a {
    color: inherit;
    text-decoration: none;
  }
  [data-field-schedule] {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    font-size: 13px;
    line-height: 1.5;
  }
  [data-field-schedule] > span {
    align-items: center;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    color: ${theme.font.color.primary};
  }
  [data-schedule-label] {
    color: ${theme.font.color.secondary};
    font-size: 12px;
    font-weight: 500;
  }
  [data-session-badge] {
    background: ${theme.background.transparent.blue};
    border-radius: 6px;
    color: ${theme.color.blue};
    font-size: 13px;
    font-weight: 600;
    padding: 4px 8px;
  }
  [data-detail-toolbar] button[data-variant='tertiary'] {
    background: ${theme.background.tertiary};
  }
  [data-detail-toolbar] button[data-variant='tertiary']:hover {
    background: ${theme.background.quaternary};
  }
  [data-contract-detail-group] {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  [data-detail-toolbar] {
    align-items: center;
    min-height: 32px;
    justify-content: space-between;
  }
  [data-detail-toolbar] > div > span {
    box-sizing: border-box;
    height: 36px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    gap: 6px;
    padding: 0 12px;
  }
  [data-detail-toolbar] > div > span > svg {
    width: 15px;
    height: 15px;
  }
  [data-contract-breadcrumb] {
    align-items: center;
    display: flex;
    gap: 8px;
    font-size: 16px;
    font-weight: ${theme.font.weight.semiBold};
  }
  && [data-detail-toolbar] [data-contract-breadcrumb] button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0;
    color: ${theme.font.color.primary};
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    gap: 8px;
    min-height: 28px;
    padding: 0;
  }
  && [data-detail-toolbar] [data-contract-breadcrumb] button:hover {
    color: ${theme.color.blue};
    text-decoration: none;
  }
  [data-contract-breadcrumb] span {
    color: ${theme.font.color.tertiary};
  }
  [data-detail-toolbar][hidden] {
    display: none;
  }
  [data-contract-detail] h2 span {
    white-space: normal;
    overflow: visible;
  }
  [data-field-header] {
    background: ${theme.background.primary};
    justify-content: space-between;
    min-height: 32px;
  }
  [data-contract-detail],
  [data-detail-start],
  [data-field-editor] {
    scroll-margin-top: 110px;
  }
  [data-field-heading] {
    align-items: center;
    display: flex;
    font-size: 16px;
    font-weight: ${theme.font.weight.semiBold};
    gap: 8px;
  }
  [data-field-heading] > span {
    color: ${theme.font.color.light};
  }
  [data-record-header] {
    justify-content: space-between;
    min-height: 32px;
  }
  &[data-contextual] > [data-contract-group],
  &[data-contextual] > [data-record-list] {
    border: none;
    border-radius: 0;
    padding: 0;
  }
  &[data-contextual] > [data-record-list] {
    margin-top: 8px;
  }
  &[data-contextual] {
    background: ${theme.background.primary};
    box-sizing: border-box;
    container-type: inline-size;
    gap: 16px;
    min-height: 100%;
    padding: 24px 24px 48px;
    > section {
      border: 1px solid ${theme.border.color.medium};
      border-radius: 8px;
      padding: 16px;
    }
    > div:first-child:not([data-contract-detail-group]) {
      justify-content: space-between;
      margin-bottom: 0;
    }
    h2 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.6px;
    }
    [data-subtitle] {
      color: ${theme.font.color.secondary};
      font-size: 13px;
      margin-top: 8px;
    }
    [data-section-title] {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin: 0;
    }
    [data-section-title] > [data-count] {
      color: ${theme.font.color.tertiary};
      font-size: 13px;
      font-weight: 500;
      margin: 0;
    }
    [data-section-title] {
      align-items: center;
      display: flex;
      gap: 12px;
    }
    button:not(
      [data-field-header] button,
      [data-record-header] button,
      [data-detail-toolbar] button,
      [data-goal-actions] button,
      button[data-goal-edit-overlay],
      button[data-dashboard-tab],
      [data-contract-pagination] button,
      [data-contract-list-controls] button
    ) {
      align-items: center;
      display: inline-flex;
      font-weight: 500;
      gap: 6px;
      justify-content: center;
      min-height: 40px;
      transition: background 0.15s;
    }
    button:not(
        [data-field-header] button,
        [data-record-header] button,
        [data-detail-toolbar] button,
        [data-goal-actions] button,
        button[data-goal-edit-overlay],
        button[data-dashboard-tab],
        [data-contract-pagination] button,
        [data-contract-list-controls] button
      ):hover {
      background: ${theme.background.tertiary};
    }
    button:not(
        [data-field-header] button,
        [data-record-header] button,
        [data-detail-toolbar] button,
        [data-goal-actions] button,
        button[data-goal-edit-overlay],
        button[data-dashboard-tab],
        [data-contract-pagination] button,
        [data-contract-list-controls] button
      ):focus-visible,
    summary:focus-visible,
    a:focus-visible {
      outline: 2px solid ${theme.border.color.blue};
      outline-offset: 3px;
    }
    [data-contract-title] {
      font-size: 15px;
      font-weight: 600;
      align-items: center;
      display: flex;
      gap: 12px;
      justify-content: space-between;
    }
    [data-chevron] {
      color: ${theme.font.color.tertiary};
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    details[open] [data-chevron] {
      transform: rotate(180deg);
    }
    [data-contract-link] {
      align-items: center;
      color: ${theme.color.blue};
      display: inline-flex;
      font-size: 13px;
      gap: 4px;
      text-decoration: none;
    }
    [data-contract-content] {
      background: ${theme.background.secondary};
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 12px;
      padding: 16px;
    }
    [data-contract-overview] {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
    }
    [data-label],
    [data-goal-grid] dt {
      color: ${theme.font.color.secondary};
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
    }
    [data-contract-overview] p {
      font-size: 13px;
    }
    [data-goal-grid] {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin: 0;
    }
    [data-goal-grid] > dl > div {
      background: ${theme.background.primary};
      border-radius: 10px;
      padding: 16px;
    }
    [data-goal-grid] dd {
      font-size: 14px;
      line-height: 1.7;
      margin: 0;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    [data-last-visit] {
      color: ${theme.font.color.secondary};
      font-size: 12px;
    }
    [data-contract-content]
      button:not([data-primary]):not([data-variant]):not(
        [data-goal-edit-overlay]
      ):not([data-kr-add]) {
      background: ${theme.background.tertiary};
      border: 1px solid ${theme.border.color.medium};
    }
    [data-contract-content] > div:last-child {
      justify-content: flex-end;
    }
    @container (max-width: 620px) {
      [data-contract-group] {
        grid-template-columns: 1fr;
      }
      [data-goal-grid] {
        grid-template-columns: 1fr;
      }
    }
    [data-contract-group] {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    && [data-contract-item]:hover {
      background: transparent;
    }
    [data-contract-detail] {
      gap: 16px;
    }
    [data-contract-detail] [data-contract-content] {
      background: transparent;
      gap: 24px;
      margin: 0;
      padding: 0;
    }
    [data-contract-detail] [data-contract-overview] {
      align-items: flex-start;
      gap: 10px 24px;
      justify-content: flex-start;
    }
    [data-contract-detail] [data-contract-overview] > div {
      align-items: center;
      display: flex;
      gap: 10px;
    }
    [data-overview-icon] {
      align-items: center;
      background: ${theme.background.tertiary};
      border-radius: 10px;
      color: ${theme.font.color.secondary};
      display: inline-flex;
      flex-shrink: 0;
      height: 40px;
      justify-content: center;
      width: 40px;
    }
    [data-overview-value] {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    [data-contract-detail] [data-label] {
      color: ${theme.font.color.primary};
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }
    [data-contract-detail] [data-last-visit] {
      align-self: flex-end;
      font-size: 13px;
    }
    [data-contract-detail] [data-goal-grid] {
      display: flex;
      flex-direction: column;
      gap: var(--t-gallery-gap, 16px);
      margin: 0;
    }
    [data-contract-detail] [data-goal-grid] > dl > div {
      align-items: baseline;
      background: ${theme.background.tertiary};
      border-radius: 8px;
      display: grid;
      gap: 16px;
      grid-template-columns: 88px minmax(0, 1fr);
      padding: 14px 12px;
    }
    [data-contract-detail] [data-goal-grid] dt {
      align-self: start;
      color: ${theme.font.color.primary};
      font-size: 16px;
      font-weight: ${theme.font.weight.semiBold};
      line-height: 1.6;
      margin: 0;
      text-align: center;
    }
    [data-contract-detail] [data-goal-grid] dd {
      color: ${theme.font.color.primary};
      font-size: ${theme.font.size.lg};
      line-height: 1.6;
      margin: 0;
      min-width: 0;
    }
    [data-contract-detail] [data-goal-grid] dd[data-unregistered] {
      color: ${theme.font.color.tertiary};
      font-size: ${theme.font.size.lg};
    }
    [data-contract-detail] {
      background: ${theme.background.primary};
      border: 1px solid ${theme.border.color.medium};
      border-radius: 8px;
      padding: 16px;
    }
    [data-contract-title-link] {
      color: inherit;
      display: inline-flex;
      max-width: 100%;
      text-decoration: none;
      border-radius: 4px;
    }
    [data-contract-title-link]:hover {
      text-decoration: underline;
      text-underline-offset: 4px;
    }
    [data-contract-title-link]:focus-visible {
      outline: 2px solid ${theme.color.blue};
      outline-offset: 4px;
    }
    [data-contract-heading] [data-field-schedule] {
      gap: 20px 32px;
      padding: 12px 0 4px;
    }
    [data-contract-heading] [data-field-schedule] > span {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }
    [data-contract-heading] [data-schedule-label] {
      font-size: 13px;
      line-height: 20px;
    }
    [data-schedule-value] {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 28px;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      line-height: 1.5;
    }
    [data-contract-heading] {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    [data-contract-byline] {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      font-size: 13px;
    }
    [data-contract-byline] > span {
      align-items: center;
      display: inline-flex;
      gap: 6px;
      color: ${theme.font.color.secondary};
      font-size: 12px;
      white-space: nowrap;
    }
    [data-contract-detail] [data-contract-heading] h2 {
      font-size: 20px;
      line-height: 1.4;
    }
    [data-contract-detail] [data-contract-overview] [data-label] {
      color: ${theme.font.color.secondary};
      font-size: 12px;
      font-weight: 400;
    }
    [data-contract-detail] [data-contract-overview] p {
      color: ${theme.font.color.primary};
      font-size: 14px;
      font-weight: 500;
      line-height: 1.5;
      margin: 0;
    }
    &&
      [data-contract-detail]
      button:not([data-variant]):not([data-goal-edit-overlay]):not(
        [data-kr-add]
      ):not([data-kr-delete]),
    && [data-contract-detail] [data-contract-link] {
      align-items: center;
      border: none;
      border-radius: 12px;
      box-shadow: none;
      box-sizing: border-box;
      display: inline-flex;
      font-size: 13px;
      font-weight: 500;
      gap: 8px;
      justify-content: center;
      min-height: 44px;
      padding: 10px 18px;
    }
    &&
      [data-contract-detail]
      button:not([data-primary]):not([data-variant]):not(
        [data-goal-edit-overlay]
      ):not([data-kr-add]):not([data-kr-delete]),
    && [data-contract-detail] [data-contract-link] {
      background: ${theme.background.tertiary};
      color: ${theme.font.color.primary};
    }
    &&
      [data-contract-detail]
      button:not([data-primary]):not([data-variant]):not(
        [data-goal-edit-overlay]
      ):not([data-kr-add]):not([data-kr-delete]):hover,
    && [data-contract-detail] [data-contract-link]:hover {
      background: ${theme.background.quaternary};
    }
    [data-contract-group] > h3 {
      grid-column: 1 / -1;
      margin: 0;
      padding-bottom: 8px;
    }
    [data-contract-card-header] {
      align-items: flex-start;
      display: flex;
      gap: 12px;
      justify-content: space-between;
    }
    [data-contract-card-header] > [data-contract-card-heading] {
      flex: 1;
      min-width: 0;
    }
    [data-contract-card-header] > details {
      flex-shrink: 0;
    }
    [data-contract-navigation] {
      align-items: center;
      background: transparent;
      border-radius: ${theme.border.radius.md};
      display: flex;
      flex-shrink: 0;
      height: 36px;
      justify-content: center;
      width: 36px;
    }
    [data-contract-navigation]:hover {
      background: ${theme.background.tertiary};
    }
    [data-contract-card-heading] {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    :is([data-contract-item], [data-contract-detail]) [data-contract-title] {
      flex-wrap: wrap;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
    }
    :is([data-contract-item], [data-contract-detail])
      [data-contract-title]
      > span {
      min-width: 0;
    }
    :is([data-contract-item], [data-contract-detail])
      [data-contract-title]
      > span
      > span:last-child {
      white-space: normal;
      overflow-wrap: anywhere;
    }
    :is([data-contract-item], [data-contract-detail])
      [data-contract-title]
      > svg {
      color: ${theme.font.color.tertiary};
      flex-shrink: 0;
    }
    [data-contract-goal-summary] {
      display: flex;
      flex-direction: column;
      gap: var(--t-gallery-gap, 16px);
      width: 100%;
    }
    [data-goal-summary-row] {
      align-items: start;
      background: ${theme.background.tertiary};
      border-radius: 8px;
      display: grid;
      gap: 12px;
      grid-template-columns: 32px minmax(0, 1fr);
      padding: 14px 12px;
    }
    [data-goal-summary-row]:not(:has(> [data-unregistered])),
    [data-contract-detail]
      [data-goal-grid]
      > div:not(:has(> dd[data-unregistered])) {
      background: color-mix(
        in srgb,
        ${theme.background.transparent.blue} 40%,
        ${theme.background.primary}
      );
    }
    && [data-session-summary],
    && [data-session-count-row] {
      background: transparent;
      border-radius: 0;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 8px;
      padding: 4px 0 16px;
    }
    && [data-session-summary] {
      row-gap: var(--t-record-card-field-gap, 4px);
      margin-bottom: 0;
      padding-bottom: 0;
    }
    [data-okr-group] {
      background: ${theme.background.tertiary};
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 0;
      padding: 14px 12px;
      overflow: hidden;
    }
    [data-session-container] {
      display: contents;
    }
    && [data-okr-group] [data-editable-goal] {
      padding-right: 32px;
    }
    [data-okr-group]:has(> div > dd:not([data-unregistered])),
    [data-okr-group]:has(
      [data-goal-summary-row] > span:not([data-unregistered])
    ) {
      background: color-mix(
        in srgb,
        ${theme.background.transparent.blue} 40%,
        ${theme.background.primary}
      );
    }
    && [data-okr-group] [data-goal-summary-row],
    && [data-contract-detail] [data-okr-group] > div {
      padding: 0;
      background: transparent;
      border-radius: 0;
    }
    && [data-session-summary] > :first-child {
      white-space: nowrap;
      width: auto;
      color: ${theme.font.color.primary};
      font-size: 16px;
      font-weight: ${theme.font.weight.semiBold};
    }
    && [data-session-count-row] input {
      max-width: 160px;
    }
    [data-goal-summary-row] > strong {
      align-self: start;
      color: ${theme.font.color.primary};
      font-size: 16px;
      font-weight: ${theme.font.weight.semiBold};
      line-height: 1.6;
      text-align: center;
    }
    [data-goal-summary-row] > span {
      color: ${theme.font.color.primary};
      font-size: ${theme.font.size.lg};
      font-weight: 400;
      line-height: 1.6;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    [data-goal-summary-row] > span[data-unregistered] {
      color: ${theme.font.color.tertiary};
      font-size: ${theme.font.size.lg};
    }
    [data-kr-summary-item] {
      align-items: baseline;
      display: flex;
      gap: 8px;
    }
    [data-kr-summary-item] + [data-kr-summary-item] {
      margin-top: 8px;
    }
    [data-contract-item] [data-goal-preview] {
      flex: 1;
      color: ${theme.font.color.primary};
      font-size: 15px;
      font-weight: 400;
      line-height: 1.65;
      margin: 0;
    }
    [data-missing-goal] {
      background: ${theme.background.primary};
      border: 1px dashed ${theme.border.color.medium};
      border-radius: 8px;
      color: ${theme.font.color.secondary};
      display: inline-flex;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 10px;
    }
    [data-contract-item] [data-missing-goal] {
      align-items: center;
      background: ${theme.background.tertiary};
      border: 1px dashed ${theme.border.color.medium};
      border-radius: ${theme.border.radius.md};
      box-sizing: border-box;
      color: ${theme.font.color.tertiary};
      font-size: ${theme.font.size.sm};
      font-weight: 400;
      justify-content: center;
      padding: 24px 16px;
      text-align: center;
      width: 100%;
    }
    [data-contract-summary] {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: ${theme.spacing[1]};
      line-height: 20px;
    }
    :is([data-contract-item], [data-contract-detail]) [data-contract-meta] {
      font-weight: 400;
      align-items: center;
      color: ${theme.font.color.secondary};
      display: inline-flex;
      gap: 6px;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }
    [data-contract-status] {
      background: ${theme.background.tertiary};
      border-radius: 4px;
      color: ${theme.font.color.secondary};
      font-size: 12px;
      font-weight: 500;
      padding: 2px 6px;
      white-space: nowrap;
    }
    [data-contract-status='ACTIVE'] {
      background: ${theme.background.transparent.success};
      color: ${theme.color.green};
    }
    [data-contract-counts] {
      color: ${theme.font.color.secondary};
      display: flex;
      flex-wrap: wrap;
      font-size: 12px;
      gap: 16px;
    }
    [data-contract-counts] > span {
      align-items: center;
      display: inline-flex;
      gap: 4px;
      white-space: nowrap;
    }
    [data-contract-counts] [data-submitted] {
      color: ${theme.color.green};
    }
    [data-contract-counts] [data-draft] {
      color: ${theme.color.orange};
    }
    [data-contract-counts] strong {
      color: inherit;
      font-weight: 600;
    }
    summary {
      cursor: pointer;
      line-height: 1.6;
      list-style: none;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary strong {
      font-size: 14px;
      font-weight: 600;
    }
    [data-goal-preview] {
      color: ${theme.font.color.primary};
      display: -webkit-box;
      font-size: 14px;
      line-height: 1.65;
      margin-top: 8px;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    [data-goal-preview][data-empty] {
      color: ${theme.font.color.tertiary};
      font-size: 13px;
    }
    details[open] [data-goal-preview] {
      display: none;
    }
    [data-contract-meta] {
      color: ${theme.font.color.secondary};
      display: block;
      font-size: 12px;
      margin: 10px 0 0;
    }
    details[open] summary {
      margin-bottom: 0;
    }
    details[open] > p {
      color: ${theme.font.color.secondary};
      margin: 10px 0;
    }
    button:not(
      [data-field-header] button,
      [data-record-header] button,
      [data-detail-toolbar] button,
      [data-goal-actions] button,
      button[data-goal-edit-overlay],
      button[data-dashboard-tab],
      [data-contract-pagination] button,
      [data-contract-list-controls] button
    ) {
      border-color: transparent;
      border-radius: 8px;
      font-size: 13px;
    }
    button:not(
        [data-field-header] button,
        [data-record-header] button,
        [data-detail-toolbar] button,
        [data-goal-actions] button,
        button[data-goal-edit-overlay],
        button[data-dashboard-tab],
        [data-contract-pagination] button,
        [data-contract-list-controls] button
      )[data-primary] {
      background: ${theme.color.blue};
      color: white;
    }
    button:not(
        [data-field-header] button,
        [data-record-header] button,
        [data-detail-toolbar] button,
        [data-goal-actions] button,
        button[data-goal-edit-overlay],
        button[data-dashboard-tab],
        [data-contract-pagination] button,
        [data-contract-list-controls] button
      )[data-primary]:hover {
      filter: brightness(0.94);
    }
    button:not(
        [data-field-header] button,
        [data-record-header] button,
        [data-detail-toolbar] button,
        [data-goal-actions] button,
        button[data-goal-edit-overlay],
        button[data-dashboard-tab],
        [data-contract-pagination] button,
        [data-contract-list-controls] button
      )[aria-pressed='true'] {
      background: ${theme.background.tertiary};
    }
    && [data-contract-detail] [data-goal-grid] button[data-inline-goal-action] {
      align-items: center;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: inherit;
      display: inline-flex;
      font-size: inherit;
      font-weight: 400;
      gap: 8px;
      justify-content: flex-start;
      line-height: 1.6;
      min-height: 24px;
      padding: 0;
      text-align: left;
      white-space: pre-wrap;
    }
    &&
      [data-contract-detail]
      [data-goal-grid]
      button[data-inline-goal-action]:hover {
      color: ${theme.color.blue};
    }
    [data-inline-goal-action] svg {
      opacity: 0;
      color: ${theme.font.color.tertiary};
      flex-shrink: 0;
    }
    [data-inline-goal-action]:hover svg,
    [data-inline-goal-action]:focus-visible svg {
      opacity: 1;
    }
    @media (hover: none) {
      [data-inline-goal-action] svg {
        opacity: 1;
      }
    }
    [data-contract-detail] [data-goal-grid] > dl > div {
      align-items: start;
      gap: 12px;
      grid-template-columns: 32px minmax(0, 1fr);
    }
    [data-goal-grid] [data-editable-goal] {
      position: relative;
      padding-right: 44px;
    }
    && [data-goal-grid] button[data-goal-edit-overlay] {
      align-items: center;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: ${theme.font.color.secondary};
      display: flex;
      inset: 0;
      justify-content: flex-end;
      padding: 0 14px;
      position: absolute;
      width: 100%;
    }
    && [data-goal-grid] button[data-goal-edit-overlay]:hover {
      background: transparent;
      color: ${theme.font.color.secondary};
    }
    [data-goal-edit-overlay] svg {
      opacity: 0;
    }
    [data-goal-edit-overlay]:hover svg,
    [data-goal-edit-overlay]:focus-visible svg {
      opacity: 1;
    }
    @media (hover: none) {
      [data-goal-edit-overlay] svg {
        opacity: 1;
      }
    }
    [data-kr-items] {
      display: flex;
      flex-direction: column;
      gap: 8px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    [data-kr-items] li {
      align-items: baseline;
      display: flex;
      gap: 8px;
    }
    [data-kr-number] {
      align-items: center;
      background: ${theme.background.transparent.blue};
      border-radius: 50%;
      color: ${theme.color.blue};
      display: inline-flex;
      flex-shrink: 0;
      font-size: ${theme.font.size.sm};
      font-weight: ${theme.font.weight.semiBold};
      height: 22px;
      justify-content: center;
      line-height: 1;
      width: 22px;
    }
  }
`;
export const StyledFieldCard = styled.section`
  border: 1px solid ${theme.border.color.medium};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
`;
export const StyledFieldRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const StyledFieldVisitDetail = styled(StyledFieldCard)`
  background: ${theme.background.primary};
  border-color: ${theme.border.color.light};
  border-radius: 16px;
  gap: 20px;
  overflow-wrap: anywhere;
  padding: 24px;
  [data-detail-title-row] {
    align-items: center;
    display: flex;
    gap: 12px;
    width: 100%;
  }
  [data-detail-title-row] > span {
    flex-shrink: 0;
    font-size: 13px;
    line-height: 24px;
    padding: 6px 10px;
  }
  [data-detail-title-row] h2 {
    flex: 1;
    min-width: 0;
  }
  [data-detail-session] {
    white-space: nowrap;
  }
  [data-detail-actions] {
    flex-shrink: 0;
  }
  [data-detail-heading] {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing[1]};
  }
  [data-detail-heading] h2 {
    font-size: 26px;
    letter-spacing: -0.6px;
    line-height: 1.45;
  }
  [data-detail-byline],
  [data-detail-context] {
    align-items: center;
    color: ${theme.font.color.primary};
    display: flex;
    flex-wrap: wrap;
    font-size: 13px;
    gap: 8px 16px;
  }
  [data-detail-byline] > span:not(:first-child) {
    align-items: center;
    display: inline-flex;
    gap: 6px;
    white-space: nowrap;
    color: ${theme.font.color.secondary};
    font-size: 12px;
  }
  [data-detail-context] {
    background: ${theme.background.tertiary};
    border-radius: 16px;
    padding: 24px;
    align-items: flex-start;
    flex-direction: column;
    gap: 24px;
  }
  [data-detail-context] a {
    color: ${theme.font.color.primary};
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    text-decoration: none;
  }
  [data-detail-context] a:hover {
    text-decoration: underline;
  }
  [data-detail-context] > span {
    color: ${theme.font.color.secondary};
    font-size: 12px;
  }
  [data-detail-goal] {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  [data-detail-goal] > span {
    color: ${theme.font.color.secondary};
    font-size: 13px;
    font-weight: 500;
  }
  [data-detail-goal] p {
    color: ${theme.font.color.primary};
    font-size: 18px;
    font-weight: 600;
    line-height: 1.6;
    margin: 0;
  }
  [data-detail-goal] p[data-empty] {
    color: ${theme.font.color.secondary};
    font-size: 13px;
    font-weight: 400;
  }
  [data-detail-context] [data-visit-schedule] {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  [data-detail-context] [data-schedule-label] {
    font-size: 13px;
    line-height: 20px;
  }
  [data-detail-context] [data-schedule-value] {
    align-items: center;
    display: flex;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    min-height: 28px;
  }
  [data-detail-body] {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  [data-detail-body] > section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  [data-detail-body] h3 {
    font-size: 16px;
    margin: 0;
  }
  [data-detail-body] p {
    font-size: 15px;
    line-height: 1.8;
  }
  [data-detail-actions] {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    padding-top: 0;
  }
  && button[data-danger] {
    background: transparent;
    color: ${theme.font.color.primary};
  }
  && button[data-danger]:hover {
    background: ${theme.background.transparent.danger};
    color: ${theme.color.red};
  }
`;

// Share the status board card sizing, spacing and responsive treatment.
export const StyledFieldRecordSection = styled(StyledDashboardSection)`
  &[data-contract-detail] {
    box-shadow: ${theme.boxShadow.light};
  }
  border-radius: 20px;
  min-width: 0;
  padding: 28px;
  &:has([data-inline-detail]) > [data-section-title] {
    display: none;
  }
  [data-detail-toolbar] button[data-variant='tertiary'] {
    background: ${theme.background.tertiary};
  }
  [data-detail-toolbar] button[data-variant='tertiary']:hover {
    background: ${theme.background.quaternary};
  }
  [data-contract-detail-group] {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  [data-detail-toolbar] {
    align-items: center;
    min-height: 32px;
    justify-content: space-between;
  }
  [data-detail-toolbar] button[data-variant='tertiary'] {
    background: ${theme.background.tertiary};
  }
  [data-detail-toolbar] button[data-variant='tertiary']:hover {
    background: ${theme.background.quaternary};
  }
  [data-contract-detail-group] {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  [data-detail-toolbar] {
    padding-bottom: 0;
  }
  && [data-detail-toolbar] button {
    background: ${theme.background.tertiary};
    padding: 8px 12px;
  }
  && [data-detail-actions] > button {
    background: ${theme.background.tertiary};
    padding: 10px 16px;
  }
  &[data-plain] {
    display: contents;
  }
`;

export const StyledFieldContractControls = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  > input {
    flex: 1 1 200px;
    min-width: 0;
    max-width: 320px;
  }

  > [data-contract-list-actions] {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
    margin-left: auto;
  }
`;

export const StyledFieldContractSummaryCard = styled.div`
  background: ${theme.background.primary};
  border: 1px solid ${theme.border.color.medium};
  border-radius: 8px;
  box-shadow: ${theme.boxShadow.light};
  padding: 16px;
  &&&& > button[data-contract-item] {
    align-items: stretch;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: flex-start;
    padding: 0;
    text-align: left;
    width: 100%;
  }
`;
