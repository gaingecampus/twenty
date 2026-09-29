import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';

export const StyledMyFieldsSurface = styled.div`
  background: var(--t-app-bg, ${theme.background.tertiary});
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
  > div {
    box-sizing: border-box;
    gap: 16px;
    margin: 0 auto;
    max-width: 1080px;
    padding: 28px 24px 48px;
  }
  button:focus-visible,
  a:focus-visible,
  input:focus-visible {
    outline: 2px solid ${theme.color.blue};
    outline-offset: 3px;
  }
  > div > [data-field-editor] > section {
    background: ${theme.background.primary};
    border: none;
    border-radius: 22px;
    padding: 24px;
  }
  > div > [data-field-editor] > section label {
    color: ${theme.font.color.secondary};
    font-size: 13px;
  }
  > div > [data-field-editor] > section input,
  > div > [data-field-editor] > section textarea {
    border-radius: 12px;
    padding: 12px 14px;
  }
  [data-field-editor] button {
    border: none;
    border-radius: 10px;
    padding: 11px 16px;
  }
  [data-field-editor] button[data-primary='true'] {
    background: ${theme.color.blue};
    color: white;
  }
  @media (max-width: 640px) {
    > div {
      padding: 20px 12px 32px;
    }
    > div > [data-field-editor] > section {
      padding: 20px;
    }
  }
`;
export const StyledMyFieldToolbar = styled.div`
  background: ${theme.background.primary};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;
export const StyledMyFieldHeading = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  && h2 {
    align-items: baseline;
    display: flex;
    gap: 8px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.6px;
  }
  h2 span {
    color: ${theme.font.color.tertiary};
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  && p {
    color: ${theme.font.color.secondary};
    font-size: 14px;
  }
  && button {
    background: ${theme.background.tertiary};
    border: none;
    border-radius: 10px;
    color: ${theme.font.color.secondary};
    display: flex;
    padding: 10px;
  }
  && button:hover {
    background: ${theme.background.secondary};
  }
`;
export const StyledMyFieldSearch = styled.div`
  align-items: center;
  background: ${theme.background.tertiary};
  border-radius: 14px;
  color: ${theme.font.color.tertiary};
  display: flex;
  gap: 10px;
  padding: 0 16px;
  && input {
    background: transparent;
    border: none;
    border-radius: 14px;
    min-width: 0;
    padding: 15px 0;
    font-size: 14px;
  }
  &:focus-within {
    box-shadow: 0 0 0 2px ${theme.border.color.blue};
  }
  && input:focus-visible {
    outline: none;
  }
`;
export const StyledMyFieldFilters = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  > div {
    background: ${theme.background.tertiary};
    border-radius: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
  }
  && button {
    background: transparent;
    border: none;
    border-radius: 10px;
    color: ${theme.font.color.secondary};
    font-size: 13px;
    padding: 9px 13px;
    white-space: nowrap;
  }
  && button:hover {
    background: ${theme.background.secondary};
  }
  && button[aria-pressed='true'] {
    background: ${theme.background.primary};
    box-shadow: none;
    color: ${theme.font.color.primary};
    font-weight: 600;
  }
  > div:last-child {
    background: transparent;
    gap: 8px;
  }
  && > div:last-child button {
    background: ${theme.background.tertiary};
  }
  && > div:last-child button[aria-pressed='true'] {
    background: ${theme.background.transparent.blue};
    box-shadow: none;
    color: ${theme.color.blue};
  }
`;
export const StyledMyFieldEmpty = styled.div`
  align-items: center;
  background: ${theme.background.primary};
  border-radius: 22px;
  color: ${theme.font.color.tertiary};
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 64px 24px;
  && h3 {
    color: ${theme.font.color.secondary};
    font-size: 16px;
  }
  && p {
    font-size: 14px;
  }
`;
export const StyledMyFieldCard = styled.article`
  background: ${theme.background.primary};
  border-radius: 20px;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 24px;
  && a {
    text-decoration: none;
  }
  && a:hover {
    text-decoration: underline;
  }
  && button {
    align-items: center;
    background: ${theme.background.tertiary};
    border: none;
    border-radius: 12px;
    box-shadow: none;
    display: inline-flex;
    font-size: 13px;
    font-weight: 500;
    gap: 6px;
    min-height: 44px;
    padding: 10px 16px;
    transition: background 120ms ease;
  }
  && button:hover {
    background: ${theme.background.tertiary};
  }
  && button[data-primary='true'] {
    background: ${theme.color.blue};
    color: white;
    padding: 11px 17px;
  }
  && button[data-primary='true']:hover {
    filter: brightness(0.95);
  }
  @media (max-width: 640px) {
    padding: 20px;
  }
`;
export const StyledMyFieldCardHeader = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  > div:first-child {
    flex: 1;
  }
  > [data-card-actions] {
    align-items: center;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
  [data-contract-state] {
    background: ${theme.background.tertiary};
    border-radius: 6px;
    color: ${theme.font.color.secondary};
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    white-space: nowrap;
  }
  && h3 {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    font-size: 18px;
    font-weight: 650;
    gap: 8px;
    letter-spacing: -0.4px;
    line-height: 1.5;
    margin: 0;
    overflow-wrap: anywhere;
  }
  && p {
    color: ${theme.font.color.secondary};
    font-size: 12px;
    margin: 0;
  }
  && a[data-company] {
    color: ${theme.font.color.secondary};
    font-size: 13px;
  }
`;
export const StyledMyFieldGoal = styled.div`
  && [data-missing] {
    align-self: flex-start;
    background: ${theme.background.primary};
    border: 1px dashed ${theme.border.color.medium};
    border-radius: 8px;
    padding: 6px 10px;
    color: ${theme.font.color.secondary};
    font-size: 13px;
    font-weight: 400;
  }
  background: ${theme.background.tertiary};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px 24px;
  > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  > div > span {
    color: ${theme.font.color.secondary};
    font-size: 13px;
    font-weight: 500;
  }
  @container (min-width: 720px) {
    flex-direction: row;
    gap: 32px;
    [data-goal-primary] {
      flex: 3;
    }
    [data-criteria] {
      flex: 2;
    }
  }
  && p {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.6;
    margin: 0;
    overflow-wrap: anywhere;
  }
  [data-criteria] {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0;
  }
  [data-criteria] > span {
    color: ${theme.font.color.secondary};
    font-size: 13px;
    font-weight: 500;
  }
  && small {
    color: ${theme.font.color.secondary};
    font-size: 12px;
    line-height: 1.6;
  }
`;
export const StyledMyFieldRecords = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  > p {
    color: ${theme.font.color.secondary};
    padding: 24px;
    text-align: center;
  }
  max-height: 360px;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  > section {
    background: ${theme.background.secondary};
    border: none;
    border-radius: 14px;
  }
`;

export const StyledMyFieldSchedule = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
  > div {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    min-width: 0;
  }
  > div > span {
    color: ${theme.font.color.secondary};
    font-size: 12px;
    flex-shrink: 0;
    line-height: 24px;
  }
  && p {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 24px;
  }
  strong {
    background: ${theme.background.transparent.blue};
    color: ${theme.color.blue};
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
  }
  [data-empty] {
    color: ${theme.font.color.secondary};
    font-size: 13px;
    font-weight: 400;
  }
  @container (min-width: 720px) {
    flex-direction: row;
    gap: 32px;
    > div:first-child {
      flex: 3;
    }
    > div:last-child {
      flex: 2;
    }
  }
  @container (max-width: 440px) {
    padding: 0;
  }
`;
