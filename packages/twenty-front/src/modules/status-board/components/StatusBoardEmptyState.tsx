import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';

const StyledEmptyState = styled.div<{ compact: boolean }>`
  align-items: center;
  display: flex;
  flex-direction: ${({ compact }) => (compact ? 'row' : 'column')};
  gap: ${({ compact }) => (compact ? '12px' : themeCssVariables.spacing[6])};
  padding: ${({ compact }) => (compact ? '12px 0' : '24px 16px')};
  text-align: ${({ compact }) => (compact ? 'left' : 'center')};

  > img {
    flex-shrink: 0;
    height: ${({ compact }) => (compact ? '48px' : '160px')};
    width: ${({ compact }) => (compact ? '60px' : '160px')};
  }
`;
const StyledActionButton = styled(Button)`
  font-size: 14px;
  margin-top: 12px;
  min-height: 44px;
  padding: 0 20px;
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.6;
`;
const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: var(--t-text-line-height-lg);
  margin: ${themeCssVariables.spacing[2]} 0 0;
  max-width: 360px;
  white-space: pre-line;
  word-break: keep-all;
`;

export const StatusBoardEmptyState = ({
  title,
  description,
  compact = false,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  variant?: 'document' | 'calendar' | 'search' | 'connection';
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <StyledEmptyState compact={compact} role="status" data-status-board-empty>
    <img
      src="/images/status-board/empty-records-illustration.png"
      alt=""
      aria-hidden="true"
      width={128}
      height={100}
      style={{ objectFit: 'contain' }}
    />
    <div>
      <StyledTitle>{title}</StyledTitle>
      {description && (
        <StyledDescription>
          {description.replace(/([.!?])\s+/g, '$1\n')}
        </StyledDescription>
      )}
    </div>
    {actionLabel && onAction && (
      <StyledActionButton
        type="button"
        title={actionLabel}
        variant="primary"
        accent="blue"
        justify="center"
        onClick={onAction}
      />
    )}
  </StyledEmptyState>
);
