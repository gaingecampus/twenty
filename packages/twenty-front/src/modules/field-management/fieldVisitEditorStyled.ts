import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
export const StyledFieldVisitEditor = styled.section`
  align-self: center;
  color: ${theme.font.color.primary};
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  gap: 32px;
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
    padding: 20px 24px;
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
    gap: 20px;
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
    gap: 20px;
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
    bottom: 0;
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
  && [data-editor-actions] button {
    border: none;
    border-radius: 12px;
    box-shadow: none;
    min-height: 44px;
    padding: 10px 18px;
  }
  && [data-editor-actions] button:not([data-primary]) {
    background: ${theme.background.tertiary};
    border: none;
    box-shadow: none;
    color: ${theme.font.color.primary};
  }
  && [data-editor-actions] button:not([data-primary]):hover {
    background: ${theme.background.quaternary};
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
`;
