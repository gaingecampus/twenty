import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { OnboardingMonthPicker } from '@/field-management/OnboardingMonthPicker';

describe('OnboardingMonthPicker', () => {
  it('selects a month in this year or the next year using canonical values', () => {
    const onChange = jest.fn();
    render(<OnboardingMonthPicker value="2026-02" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '2026년 11월' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-02, 2026-11');
    fireEvent.click(screen.getByRole('button', { name: /다음 연도/ }));
    fireEvent.click(screen.getByRole('button', { name: '2027년 1월' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-02, 2027-01');
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

it('keeps selections across years and removes only the toggled month', () => {
  const onConfirm = jest.fn();
  const StatefulPicker = () => {
    const [value, setValue] = useState('2026-11, 2026-12');
    return (
      <OnboardingMonthPicker
        value={value}
        onChange={setValue}
        onConfirm={onConfirm}
      />
    );
  };
  render(<StatefulPicker />);
  fireEvent.click(screen.getByRole('button', { name: /다음 연도/ }));
  fireEvent.click(screen.getByRole('button', { name: '2027년 1월' }));
  expect(
    screen.getByText('선택한 월: 2026-11, 2026-12, 2027-01'),
  ).toBeInTheDocument();
  expect(onConfirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /이전 연도/ }));
  fireEvent.click(screen.getByRole('button', { name: '2026년 11월' }));
  expect(screen.getByText('선택한 월: 2026-12, 2027-01')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /적용/ }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
it('does not overwrite unresolved legacy months on month click', () => {
  const onChange = jest.fn();
  render(<OnboardingMonthPicker value="8월, 9월" onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: /년 1월$/ }));
  expect(onChange).not.toHaveBeenCalled();
});
