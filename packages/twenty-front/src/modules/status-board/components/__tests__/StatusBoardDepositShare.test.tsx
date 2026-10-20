import { render, screen } from '@testing-library/react';
import { StatusBoardDepositShare } from '@/status-board/components/StatusBoardDepositShare';

const mockSum = jest.fn();
jest.mock('@/status-board/hooks/useStatusBoardSum', () => ({
  useStatusBoardSum: (...args: unknown[]) => mockSum(...args),
}));
beforeEach(() => mockSum.mockReset());

it('adds Gainge won to CRM micros converted to won', () => {
  mockSum
    .mockReturnValueOnce({ sum: 2000000000, loading: false })
    .mockReturnValueOnce({ sum: 3000000000, loading: false });
  render(<StatusBoardDepositShare dateBasis="발행일" gaingeAmount={10000} />);
  expect(screen.getByText('15,000원')).toBeInTheDocument();
  expect(screen.getByText('5,000원')).toBeInTheDocument();
  expect(screen.getByText('10,000원')).toBeInTheDocument();
});

it('does not display a partial total when Gainge is unavailable', () => {
  mockSum.mockReturnValue({ sum: 1000000000, loading: false });
  render(<StatusBoardDepositShare dateBasis="발행일" gaingeAmount={null} />);
  expect(screen.getByText('전체 합계').parentElement).toHaveTextContent('—');
});

it('does not display a partial total when CRM fails', () => {
  mockSum.mockReturnValue({ error: new Error('unavailable'), loading: false });
  render(<StatusBoardDepositShare dateBasis="발행일" gaingeAmount={10000} />);
  expect(screen.getByText('전체 합계').parentElement).toHaveTextContent('—');
  expect(screen.getByRole('status')).toHaveTextContent('불러오지 못했어요');
});
