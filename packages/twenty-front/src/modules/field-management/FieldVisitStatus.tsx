import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
import { IconCheck, IconPencil } from 'twenty-ui/icon';
const StyledStatus = styled.span<{ submitted: boolean }>`
  align-items: center;
  background: ${({ submitted }) =>
    submitted
      ? theme.background.transparent.success
      : theme.background.transparent.orange};
  border-radius: 6px;
  color: ${({ submitted }) =>
    submitted ? theme.color.green : theme.color.orange};
  display: inline-flex;
  font-size: 12px;
  font-weight: 500;
  gap: 4px;
  padding: 4px 6px;
  white-space: nowrap;
`;
export const FieldVisitStatus = ({ submitted }: { submitted: boolean }) => (
  <StyledStatus submitted={submitted}>
    {submitted ? (
      <IconCheck size={13} aria-hidden="true" />
    ) : (
      <IconPencil size={13} aria-hidden="true" />
    )}
    {submitted ? '제출' : '초안'}
  </StyledStatus>
);
