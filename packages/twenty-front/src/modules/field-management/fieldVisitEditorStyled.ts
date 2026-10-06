import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
export const StyledFieldVisitEditor = styled.section`
  [data-kr-list] {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  [data-kr-list] > div {
    flex-wrap: nowrap;
  }
  [data-kr-list] input {
    flex: 1;
    min-width: 0;
  }
  [data-kr-list] > button {
    align-self: flex-start;
  }

  align-self: center;
  color: ${theme.font.color.primary};
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  gap: 16px;
  margin: 0;
  width: 100%;
  > :not([data-editor-actions]) {
    align-self: center;
    box-sizing: border-box;
    max-width: 760px;
    width: 100%;
  }
  &[data-goal-editor] {
    gap: 24px;
  }
  &[data-goal-editor] [data-editor-contract] {
    padding: 16px 20px;
  }
  &[data-goal-editor] [data-editor-actions] {
    padding-top: 8px;
    padding-bottom: 0;
  }
  header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  header h2 {
    font-size: 26px;
    line-height: 1.4;
    margin: 0;
  }
  header p {
    color: ${theme.font.color.secondary};
    font-size: 13px;
    margin: 0;
  }
  [data-editor-contract] {
    background: ${theme.background.tertiary};
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
  a[data-editor-contract] {
    align-items: center;
    color: ${theme.font.color.primary};
    flex-direction: row;
    justify-content: space-between;
    text-decoration: none;
  }
  a[data-editor-contract] > svg {
    flex-shrink: 0;
  }
  a[data-editor-contract],
  [data-editor-contract][role='button'] {
    cursor: pointer;
    transition: background 0.15s;
  }
  a[data-editor-contract]:hover,
  [data-editor-contract][role='button']:hover {
    background: ${theme.background.quaternary};
  }
  a[data-editor-contract]:focus-visible,
  [data-editor-contract][role='button']:focus-visible {
    outline: 2px solid ${theme.color.blue};
    outline-offset: 3px;
  }
  [data-editor-contract] > span {
    color: ${theme.font.color.primary};
    font-size: 15px;
    font-weight: 600;
  }
  [data-editor-contract] > p {
    color: ${theme.font.color.primary};
    display: flex;
    flex-direction: column;
    font-size: 14px;
    font-weight: 400;
    gap: 6px;
    line-height: 1.7;
    margin: 0;
  }
  [data-editor-contract] > p > span {
    color: ${theme.font.color.secondary};
    display: block;
    font-size: 13px;
    font-weight: 600;
  }
  [data-editor-section] {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h3 {
    font-size: 18px;
    font-weight: 600;
  }
  && label {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    font-weight: 600;
    gap: 8px;
  }
  && label > span:not([data-field-error]) {
    align-items: baseline;
    display: inline-flex;
    gap: 4px;
    line-height: 20px;
  }
  && [data-required] {
    color: ${theme.color.red};
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    margin: 0;
  }
  [data-editor-grid] {
    display: flex;
    gap: 16px;
  }
  [data-editor-grid] > label {
    flex: 1;
    min-width: 0;
  }
  [data-editor-grid] > label:first-child {
    flex: 2;
  }
  && input,
  && textarea {
    background: ${theme.background.primary};
    border: 1px solid ${theme.border.color.light};
    border-radius: 12px;
    box-shadow: ${theme.boxShadow.light};
    color: ${theme.font.color.primary};
    font-size: 15px;
    font-weight: 400;
    line-height: 1.7;
    padding: 14px 16px;
  }
  && textarea {
    min-height: 0;
  }
  input::placeholder,
  textarea::placeholder {
    color: ${theme.font.color.tertiary};
  }
  input:focus,
  textarea:focus {
    border-color: ${theme.color.blue};
    outline: 2px solid ${theme.background.transparent.blue};
    outline-offset: 1px;
  }
  [data-editor-actions] {
    align-self: center;
    box-sizing: border-box;
    background: ${theme.background.primary};
    bottom: var(--field-editor-sticky-bottom, 0px);
    justify-content: flex-end;
    padding: 16px var(--field-editor-inset, 0px);
    position: sticky;
    width: calc(100% + 2 * var(--field-editor-inset, 0px));
    z-index: 2;
  }
  [data-editor-actions]::before {
    background: linear-gradient(
      to bottom,
      transparent,
      ${theme.background.primary}
    );
    content: '';
    height: 32px;
    left: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: -32px;
  }
  && [data-editor-actions]:not([data-goal-actions]) button {
    border: none;
    border-radius: 12px;
    box-shadow: none;
    min-height: 44px;
    padding: 10px 18px;
  }
  && [data-editor-actions]:not([data-goal-actions]) button:not([data-primary]) {
    background: ${theme.background.tertiary};
    border: none;
    box-shadow: none;
    color: ${theme.font.color.primary};
  }
  &&
    [data-editor-actions]:not([data-goal-actions])
    button:not([data-primary]):hover {
    background: ${theme.background.quaternary};
  }
  &&& [data-editor-actions] button[data-cancel],
  &&& [data-editor-actions] button[data-cancel]:hover {
    background: ${theme.background.primary};
    border: 1px solid ${theme.color.red};
    color: ${theme.color.red};
  }
  [data-action-spacer] {
    flex: 1;
  }
  [role='alert'] {
    background: ${theme.background.transparent.danger};
    border-radius: 8px;
    color: ${theme.color.red};
    padding: 12px 16px;
  }
  && [data-field-error] {
    background: transparent;
    color: ${theme.color.red};
    font-size: 12px;
    margin: 0;
    padding: 0;
  }
  && [aria-invalid='true'] {
    border-color: ${theme.color.red};
  }
  @container (max-width: 440px) {
    [data-editor-grid] {
      flex-direction: column;
    }
  }

  &&[data-inline-goal-editor] {
    gap: 8px;
  }
  &&[data-inline-goal-editor] [data-session-count-row],
  &&[data-inline-goal-editor] [data-goal-input-row],
  &&[data-inline-goal-editor] [data-kr-list] {
    align-items: start;
    background: ${theme.background.tertiary};
    border-radius: 8px;
    display: grid;
    gap: 12px;
    grid-template-columns: 32px minmax(0, 1fr);
    max-width: none;
    padding: 14px 12px;
  }
  &&[data-inline-goal-editor] [data-session-count-row] > span,
  &&[data-inline-goal-editor] [data-goal-input-row] > span,
  &&[data-inline-goal-editor] [data-kr-list] > span {
    font-size: 16px;
    font-weight: ${theme.font.weight.semiBold};
    line-height: 24px;
    align-self: center;
    justify-content: center;
    padding-top: 0;
    text-align: center;
  }
  &&[data-inline-goal-editor] [data-goal-input-row] > span {
    align-self: start;
    padding-top: 7px;
  }
  && [data-kr-label] {
    align-items: center;
    align-self: start;
    display: flex;
    flex-direction: column;
    font-size: 16px;
    font-weight: ${theme.font.weight.semiBold};
    gap: 8px;
    line-height: 24px;
    padding-top: 7px;
  }
  [data-kr-inputs] {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  [data-kr-inputs][data-empty] {
    justify-content: center;
    min-height: 64px;
  }
  [data-kr-inputs] > div {
    flex-wrap: nowrap;
  }
  [data-kr-inputs] > button {
    align-self: center;
  }
  &&[data-inline-goal-editor] textarea,
  &&[data-inline-goal-editor] input {
    background: ${theme.background.primary};
    border: 1px solid ${theme.border.color.medium};
    border-radius: 6px;
    box-shadow: none;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 24px;
    min-height: 36px;
    padding: 6px 10px;
    width: 100%;
  }
  &&[data-inline-goal-editor] textarea:focus,
  &&[data-inline-goal-editor] input:focus {
    border-color: ${theme.color.blue};
    outline: none;
  }
  &&[data-inline-goal-editor] [data-editor-actions] {
    gap: 8px;
    padding: 8px 0 0;
    position: static;
    width: 100%;
  }
  &&[data-inline-goal-editor] [data-editor-actions]::before {
    display: none;
  }
  &&[data-inline-goal-editor] button:not([data-variant]) {
    border-radius: 6px;
    min-height: 32px;
    padding: 6px 12px;
  }
  &&[data-inline-goal-editor] [data-kr-inputs] > button {
    align-items: center;
    background: ${theme.background.primary};
    border: 1px solid ${theme.border.color.medium};
    color: ${theme.font.color.secondary};
    display: inline-flex;
    font-size: 14px;
    gap: 6px;
  }
  &&[data-inline-goal-editor] [data-kr-inputs] > button:hover {
    background: ${theme.background.secondary};
    border-color: ${theme.border.color.strong};
  }
  &&&& button[data-kr-add],
  &&&& [data-kr-inputs] button[data-kr-delete] {
    align-items: center;
    background: ${theme.background.primary};
    border: 1px solid ${theme.border.color.medium};
    display: inline-flex;
    flex: 0 0 28px;
    height: 28px;
    justify-content: center;
    min-height: 28px;
    padding: 0;
    width: 28px;
  }
  &&&& [data-kr-inputs] button[data-kr-delete] {
    border-color: ${theme.border.color.medium};
    box-sizing: border-box;
    color: ${theme.font.color.secondary};
    flex-basis: 38px;
    height: 38px;
    min-height: 38px;
    min-width: 38px;
    width: 38px;
  }
  &&&& [data-kr-inputs] button[data-kr-delete]:hover {
    border-color: ${theme.color.red};
    color: ${theme.color.red};
  }
  button[data-kr-add] > svg,
  button[data-kr-delete] > svg {
    flex-shrink: 0;
  }
  &&&& button[data-kr-add] {
    color: ${theme.font.color.secondary};
  }
  &&[data-inline-goal-editor] [data-session-count-row] input {
    max-width: none;
  }
`;
