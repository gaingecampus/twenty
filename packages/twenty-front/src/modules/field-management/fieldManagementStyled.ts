import { StyledStatusBoardSection } from '@/status-board/components/statusBoardStyled';
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
  button,
  a {
    font: inherit;
  }
  button {
    background: ${theme.background.secondary};
    border: 1px solid ${theme.border.color.medium};
    border-radius: 6px;
    color: inherit;
    cursor: pointer;
    padding: 8px 12px;
  }
  button[aria-pressed='true'] {
    background: ${theme.background.tertiary};
    font-weight: 600;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  a {
    color: ${theme.font.color.primary};
  }
  &[data-contextual] {
    font-size: 14px;
  }
  &[data-inline-detail] {
    gap: 16px;
    padding: 0;
  }
  &[data-inline-detail] > section {
    border: none;
    padding: 0;
  }
  &[data-writing]
    > :not([data-field-header]):not([data-field-editor]):not([role='status']) {
    display: none;
  }
  &[data-writing] [data-field-editor] {
    --field-editor-inset: 32px;
    background: ${theme.background.primary};
    border-radius: 20px;
    padding: 32px;
  }
  &[data-writing] [data-field-editor] > section {
    border: none;
    padding: 0;
  }
  &[data-contract-reading]
    > :not([data-contract-detail]):not([data-field-header]):not(
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
  [data-detail-toolbar] {
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
    order: -1;
    padding: 4px 0;
    position: sticky;
    top: 0;
    z-index: 11;
  }
  [data-contract-detail],
  [data-detail-start],
  [data-field-editor] {
    scroll-margin-top: 110px;
  }
  [data-field-header] [data-field-heading] {
    align-items: center;
    display: flex;
    font-size: 16px;
    font-weight: ${theme.font.weight.semiBold};
    gap: 8px;
  }
  [data-field-heading] > span {
    color: ${theme.font.color.light};
  }
  &[data-contextual] [data-field-header] button[data-field-add] {
    background: ${theme.background.primary};
    color: ${theme.font.color.secondary};
    font-size: 13px;
    min-height: 28px;
    padding: 4px 12px;
  }
  &[data-contextual] [data-field-header] button[data-field-add]:hover {
    background: ${theme.background.tertiary};
  }
  &[data-contextual] {
    background: ${theme.background.primary};
    box-sizing: border-box;
    container-type: inline-size;
    gap: 16px;
    min-height: 100%;
    padding: 20px 24px 48px;
    > section {
      border: 1px solid ${theme.border.color.medium};
      border-radius: 8px;
      padding: 16px;
    }
    > div:first-child {
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
    button {
      align-items: center;
      display: inline-flex;
      font-weight: 500;
      gap: 6px;
      justify-content: center;
      min-height: 40px;
      transition: background 0.15s;
    }
    button:hover {
      background: ${theme.background.tertiary};
    }
    button:focus-visible,
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
    [data-goal-grid] > div {
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
    [data-contract-content] button:not([data-primary]) {
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
      background: ${theme.background.tertiary};
    }
    [data-contract-detail] {
      gap: 24px;
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
      gap: 24px;
    }
    [data-contract-detail] [data-goal-grid] > div {
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0;
    }
    [data-contract-detail] [data-goal-grid] {
      background: ${theme.background.tertiary};
      border-radius: 16px;
      padding: 24px;
    }
    [data-contract-detail] [data-goal-grid] dt {
      line-height: 20px;
      color: ${theme.font.color.primary};
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }
    [data-contract-detail] [data-goal-grid] dd {
      margin: 0;
      font-size: 15px;
      line-height: 1.7;
    }
    [data-contract-detail] [data-goal-grid] > div:first-child dt {
      color: ${theme.color.blue};
      font-size: 13px;
    }
    [data-contract-detail] [data-goal-grid] > div:first-child dd {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.3px;
      line-height: 1.6;
    }
    [data-contract-detail] [data-goal-grid] dd[data-unregistered] {
      color: ${theme.font.color.secondary};
      font-size: 13px;
      font-weight: 400;
      letter-spacing: 0;
      line-height: 1.5;
    }
    [data-contract-detail] [data-goal-grid] > div:has([data-unregistered]) dt {
      color: ${theme.font.color.secondary};
    }
    [data-contract-detail] {
      padding: 32px;
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
    && [data-contract-detail] button,
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
    && [data-contract-detail] button:not([data-primary]),
    && [data-contract-detail] [data-contract-link] {
      background: ${theme.background.tertiary};
      color: ${theme.font.color.primary};
    }
    && [data-contract-detail] button:not([data-primary]):hover,
    && [data-contract-detail] [data-contract-link]:hover {
      background: ${theme.background.quaternary};
    }
    [data-contract-group] > h3 {
      grid-column: 1 / -1;
      margin: 0;
      padding-bottom: 8px;
    }
    && [data-contract-group] > [data-contract-item] {
      background: ${theme.background.primary};
      border: 1px solid ${theme.border.color.medium};
      border-radius: 8px;
      display: block;
      padding: 16px;
      text-align: left;
      width: 100%;
    }
    && [data-contract-group] > [data-contract-item] {
      align-items: stretch;
      display: flex;
      flex-direction: column;
      gap: 12px;
      justify-content: flex-start;
    }
    [data-contract-item] [data-contract-title] {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
    }
    [data-contract-item] [data-contract-title] > span {
      min-width: 0;
    }
    [data-contract-item] [data-contract-title] > span > span:last-child {
      white-space: normal;
      overflow-wrap: anywhere;
    }
    [data-contract-item] [data-contract-title] > svg {
      color: ${theme.font.color.tertiary};
      flex-shrink: 0;
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
    [data-contract-summary] {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px 16px;
    }
    [data-contract-item] [data-contract-meta] {
      align-items: center;
      color: ${theme.font.color.secondary};
      display: inline-flex;
      gap: 6px;
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
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
    button {
      border-color: transparent;
      border-radius: 8px;
      font-size: 13px;
    }
    button[data-primary] {
      background: ${theme.color.blue};
      color: white;
    }
    button[data-primary]:hover {
      filter: brightness(0.94);
    }
    button[aria-pressed='true'] {
      background: ${theme.background.tertiary};
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
    align-items: flex-start;
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
    min-width: 0;
  }
  [data-detail-heading] {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    padding-top: 12px;
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
export const StyledFieldRecordSection = styled(StyledStatusBoardSection)`
  border-radius: 20px;
  min-width: 0;
  padding: 28px;
  &:has([data-inline-detail]) > [data-section-title] {
    display: none;
  }
  [data-detail-toolbar] {
    justify-content: space-between;
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
