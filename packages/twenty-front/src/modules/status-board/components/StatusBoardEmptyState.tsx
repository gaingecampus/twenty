import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';

const StyledEmptyState = styled.div<{ compact: boolean }>`
  align-items: center;
  display: flex;
  flex-direction: ${({ compact }) => (compact ? 'row' : 'column')};
  gap: ${({ compact }) => (compact ? '12px' : '8px')};
  padding: ${({ compact }) => (compact ? '12px 0' : '24px 16px')};
  text-align: ${({ compact }) => (compact ? 'left' : 'center')};

  svg {
    flex-shrink: 0;
    height: ${({ compact }) => (compact ? '48px' : '100px')};
    width: ${({ compact }) => (compact ? '60px' : '128px')};
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
  font-size: 14px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.6;
`;
const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 13px;
  line-height: 1.7;
  margin: 4px 0 0;
  max-width: 360px;
  word-break: keep-all;
`;

export const StatusBoardEmptyState = ({
  title,
  description,
  variant = 'document',
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
  <StyledEmptyState compact={compact} role="status">
    <svg viewBox="0 0 128 100" fill="none" aria-hidden="true">
      <ellipse
        cx="64"
        cy="86"
        rx="43"
        ry="7"
        fill={themeCssVariables.background.tertiary}
      />
      <rect
        x="32"
        y="17"
        width="60"
        height="68"
        rx="10"
        transform="rotate(-9 32 17)"
        fill={themeCssVariables.tag.background.blue}
      />
      <rect
        x="35"
        y="12"
        width="60"
        height="70"
        rx="10"
        fill={themeCssVariables.background.primary}
        stroke={themeCssVariables.border.color.medium}
        strokeWidth="2"
      />
      {variant === 'calendar' ? (
        <>
          <path
            d="M36 34H94M49 8V20M81 8V20"
            stroke={themeCssVariables.tag.text.blue}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M49 47H53M65 47H69M81 47H85M49 60H53M65 60H69"
            stroke={themeCssVariables.border.color.strong}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <rect
            x="47"
            y="26"
            width="22"
            height="7"
            rx="3.5"
            fill={themeCssVariables.tag.background.blue}
          />
          <path
            d="M48 45H80M48 55H75M48 65H64"
            stroke={themeCssVariables.border.color.medium}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      <circle
        cx="94"
        cy="71"
        r="18"
        fill={themeCssVariables.tag.background.blue}
      />
      {variant === 'search' ? (
        <>
          <circle
            cx="91"
            cy="68"
            r="6"
            stroke={themeCssVariables.tag.text.blue}
            strokeWidth="3"
          />
          <path
            d="M96 73L102 79"
            stroke={themeCssVariables.tag.text.blue}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : variant === 'connection' ? (
        <path
          d="M94 62V73M94 79V80"
          stroke={themeCssVariables.tag.text.blue}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M86 71L92 77L103 65"
          stroke={themeCssVariables.tag.text.blue}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
    <div>
      <StyledTitle>{title}</StyledTitle>
      {description && <StyledDescription>{description}</StyledDescription>}
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
