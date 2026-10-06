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
  justify-content: center;
  padding: 4px 6px;
  &[data-roomy] {
    box-sizing: border-box;
    min-height: 32px;
    min-width: 64px;
    padding: 6px 12px;
  }
  white-space: nowrap;
`;
export const FieldVisitStatus = ({
  submitted,
  roomy = false,
}: {
  submitted: boolean;
  roomy?: boolean;
}) => (
  <StyledStatus submitted={submitted} data-roomy={roomy || undefined}>
    {submitted ? (
      <IconCheck size={13} aria-hidden="true" />
    ) : (
      <IconPencil size={13} aria-hidden="true" />
    )}
    {submitted ? '제출' : '초안'}
  </StyledStatus>
);
