import { fireEvent, render, screen } from '@testing-library/react';
import { OnboardingMonthPicker } from '@/field-management/OnboardingMonthPicker';

describe('OnboardingMonthPicker', () => {
  it('selects a month in this year or the next year using canonical values', () => {
    const onChange = jest.fn();
    render(<OnboardingMonthPicker value="2026-02" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '2026년 11월' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-11');
    fireEvent.click(screen.getByRole('button', { name: /다음 연도/ }));
    fireEvent.click(screen.getByRole('button', { name: '2027년 1월' }));
    expect(onChange).toHaveBeenLastCalledWith('2027-01');
    fireEvent.click(screen.getByRole('button', { name: /선택 지우기/ }));
    expect(onChange).toHaveBeenLastCalledWith('');
  });
  it('does not allow edits to a read-only field', () => {
    const onChange = jest.fn();
    render(
      <OnboardingMonthPicker value="2026-02" onChange={onChange} readonly />,
    );
    fireEvent.click(screen.getByRole('button', { name: '2026년 11월' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
