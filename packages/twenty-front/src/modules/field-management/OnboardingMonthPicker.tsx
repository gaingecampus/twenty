import { parseOnboardingMonths } from '@/field-management/onboardingMonth';
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
  onConfirm,
}: {
  value: string;
  onChange: (value: string) => void;
  readonly?: boolean;
  onConfirm?: () => void;
}) => {
  const months = parseOnboardingMonths(value);
  const [year, setYear] = useState(
    months?.length ? Number(months[0].slice(0, 4)) : new Date().getFullYear(),
  );

  return (
    <StyledPicker role="group" aria-label="온보딩 월 선택">
      <span>
        여러 월을 선택할 수 있습니다. 선택한 월을 다시 누르면 해제됩니다.
      </span>
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
              disabled={readonly || months === null}
              aria-label={`${year}년 ${month}월`}
              aria-pressed={months?.includes(monthValue) ?? false}
              onClick={() => {
                if (!months) return;
                const selected = months.includes(monthValue)
                  ? months.filter(
                      (selectedMonth) => selectedMonth !== monthValue,
                    )
                  : [...months, monthValue];
                onChange(selected.sort().join(', '));
              }}
            >
              {month}월
            </StyledMonth>
          );
        })}
      </StyledMonths>
      {months && months.length > 0 && (
        <span>선택한 월: {months.join(', ')}</span>
      )}
      {months === null && (
        <span>
          기존 값: {value} — 해석할 수 없는 값입니다. 기존 값을 확인한 뒤 지우고
          다시 선택해 주세요.
        </span>
      )}
      <Button
        title="선택 지우기"
        size="small"
        variant="tertiary"
        disabled={readonly || !value}
        onClick={() => onChange('')}
      />
      {onConfirm && (
        <Button
          title="적용"
          variant="primary"
          disabled={readonly}
          onClick={onConfirm}
        />
      )}
    </StyledPicker>
  );
};
