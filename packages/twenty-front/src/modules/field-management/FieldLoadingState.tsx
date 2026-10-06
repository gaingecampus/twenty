import { styled } from '@linaria/react';
import { Loader } from 'twenty-ui/feedback';
import { StyledFieldEmptyState } from './FieldEmptyState';

const StyledLoadingState = styled(StyledFieldEmptyState)`
  flex-direction: column;
  gap: 12px;
`;

export const FieldLoadingState = ({ label }: { label: string }) => (
  <StyledLoadingState
    as="div"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span aria-hidden="true">
      <Loader color="gray" />
    </span>
    <span>{label}</span>
  </StyledLoadingState>
);
