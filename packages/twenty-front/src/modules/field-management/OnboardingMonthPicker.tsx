import { normalizeOnboardingMonth } from '@/field-management/onboardingMonth';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledPicker = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 240px;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledMonths = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  grid-template-columns: repeat(3, 1fr);
`;

const StyledMonth = styled.button`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font: inherit;
  padding: ${themeCssVariables.spacing[2]};
  &:hover,
  &:focus-visible {
    background: ${themeCssVariables.background.transparent.light};
  }
  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.color.blue};
    color: ${themeCssVariables.color.blue};
  }
`;

export const OnboardingMonthPicker = ({
  value,
  onChange,
  readonly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  readonly?: boolean;
}) => {
  const normalized = normalizeOnboardingMonth(value);
  const [year, setYear] = useState(
    normalized ? Number(normalized.slice(0, 4)) : new Date().getFullYear(),
  );

  return (
    <StyledPicker role="group" aria-label="온보딩 월 선택">
      <StyledHeader>
        <Button
          title="이전 연도"
          Icon={IconChevronLeft}
          size="small"
          variant="tertiary"
          disabled={readonly || year <= 1}
          onClick={() => setYear(year - 1)}
        />
        <span aria-live="polite">{year}년</span>
        <Button
          title="다음 연도"
          Icon={IconChevronRight}
          size="small"
          variant="tertiary"
          disabled={readonly || year >= 9999}
          onClick={() => setYear(year + 1)}
        />
      </StyledHeader>
      <StyledMonths>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
          const monthValue = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
          return (
            <StyledMonth
              key={month}
              type="button"
              disabled={readonly}
              aria-label={`${year}년 ${month}월`}
              aria-pressed={normalized === monthValue}
              onClick={() => onChange(monthValue)}
            >
              {month}월
            </StyledMonth>
          );
        })}
      </StyledMonths>
      {value && !normalized && (
        <span>기존 값: {value} — 연·월을 다시 선택해 주세요.</span>
      )}
      <Button
        title="선택 지우기"
        size="small"
        variant="tertiary"
        disabled={readonly || !value}
        onClick={() => onChange('')}
      />
    </StyledPicker>
  );
};
