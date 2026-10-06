import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';

const StyledProgress = styled.span`
  background: ${theme.background.tertiary};
  border-radius: 4px;
  display: block;
  flex-basis: 100%;
  height: 10px;
  overflow: hidden;
  position: relative;
  width: 100%;

  > span {
    background: ${theme.color.blue};
    display: block;
    height: 100%;
  }
`;

export const FieldSessionProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number | null;
}) => {
  const knownTotal = total !== null && total > 0;
  const percent = knownTotal
    ? Math.min(100, Math.max(0, (current / total) * 100))
    : 0;
  return (
    <StyledProgress
      role="progressbar"
      aria-label="회차 진행률"
      aria-valuemin={0}
      aria-valuemax={knownTotal ? total : undefined}
      aria-valuenow={
        knownTotal ? Math.min(total, Math.max(0, current)) : undefined
      }
      aria-valuetext={
        knownTotal ? `총 ${total}회 중 ${current}회 진행` : '총 회차 미정'
      }
      style={
        knownTotal
          ? {
              maskImage: `repeating-linear-gradient(to right, ${theme.font.color.primary} 0, ${theme.font.color.primary} calc(${100 / total}% - 2px), transparent calc(${100 / total}% - 2px), transparent ${100 / total}%)`,
            }
          : undefined
      }
    >
      <span style={{ width: `${percent}%` }} />
    </StyledProgress>
  );
};
