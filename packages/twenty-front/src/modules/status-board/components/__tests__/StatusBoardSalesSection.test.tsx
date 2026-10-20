jest.mock('@/status-board/components/StatusBoardSalesChart', () => ({
  StatusBoardSalesChart: () => null,
}));
import { fireEvent, render, screen } from '@testing-library/react';

import { StatusBoardSalesSection } from '@/status-board/components/StatusBoardSalesSection';

const mockQuery = jest.fn();
const mockRefetch = jest.fn().mockResolvedValue({});

jest.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => mockQuery(...args),
}));
jest.mock('@/object-metadata/hooks/useApolloCoreClient', () => ({
  useApolloCoreClient: () => ({}),
}));

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-15T00:00:00Z'));
  mockQuery.mockReturnValue({
    loading: false,
    refetch: mockRefetch,
    data: {
      gaingeMonthlySales: {
        status: 'NOT_CONFIGURED',
        month: '2026-10',
        total: null,
        departments: [],
      },
    },
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

it('shows connection pending without inventing zero revenue', () => {
  render(<StatusBoardSalesSection />);
  expect(screen.getByRole('status')).toHaveTextContent('연결 대기');
  expect(screen.queryByText('0원')).not.toBeInTheDocument();
});
it('shows full won amounts, zero departments and a separate company-wide scope', () => {
  mockQuery.mockReturnValue({
    loading: false,
    refetch: mockRefetch,
    data: {
      gaingeMonthlySales: {
        status: 'READY',
        month: '2026-10',
        total: 1234567,
        departments: [
          { label: '캠퍼스BU', amount: 1234567 },
          { label: 'AX센터', amount: 0 },
        ],
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        fetchedAt: '2026-10-15T00:00:00Z',
      },
    },
  });
  render(<StatusBoardSalesSection />);
  expect(screen.getAllByText('1,234,567원')).toHaveLength(2);
  expect(screen.getByText('0원')).toBeInTheDocument();
  expect(
    screen.getByLabelText(/매출 집계 기준:.*상단 그룹·구성원 필터/),
  ).toBeInTheDocument();
});
it('does not display a previous month response when switching month', () => {
  mockQuery.mockReturnValue({
    loading: false,
    refetch: mockRefetch,
    data: {
      gaingeMonthlySales: {
        status: 'READY',
        month: '2026-10',
        total: 100,
        departments: [],
      },
    },
  });
  render(<StatusBoardSalesSection />);
  expect(screen.getByRole('button', { name: '다음 매출 월' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '이전 매출 월' }));
  expect(screen.getByText('2026년 09월')).toBeInTheDocument();
  expect(screen.queryByText('100원')).not.toBeInTheDocument();
  expect(mockQuery.mock.calls.at(-1)[1].variables).toEqual({
    month: '2026-09',
  });
});
it.each(['AUTH_ERROR', 'UNAVAILABLE', 'FORBIDDEN'])(
  'shows %s without revenue',
  (status) => {
    mockQuery.mockReturnValue({
      loading: false,
      refetch: mockRefetch,
      data: {
        gaingeMonthlySales: {
          status,
          month: '2026-10',
          total: null,
          departments: [],
        },
      },
    });
    render(<StatusBoardSalesSection />);
    expect(screen.getByRole('status')).not.toHaveTextContent('연결 대기');
    expect(screen.queryByText('0원')).not.toBeInTheDocument();
  },
);
it('allows retry after an API failure', () => {
  mockQuery.mockReturnValue({
    error: new Error('network'),
    loading: false,
    refetch: mockRefetch,
  });
  render(<StatusBoardSalesSection />);
  fireEvent.click(screen.getByRole('button', { name: '매출 새로고침' }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

it('switches to issued deposits without requesting Gainge revenue and keeps the selected month', () => {
  render(
    <StatusBoardSalesSection
      depositProps={{ selectedGroupIds: [], isGroupUnavailable: true }}
    />,
  );
  expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: '입금' }));
  expect(screen.getByRole('status')).toHaveTextContent('선택한 그룹');
  expect(mockQuery.mock.calls.at(-1)[1].skip).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '이전 매출 월' }));
  expect(mockQuery.mock.calls.at(-1)[1].variables.month).toBe('2026-09');
  fireEvent.click(screen.getByRole('button', { name: '가캠' }));
  expect(mockQuery.mock.calls.at(-1)[1].skip).toBe(false);
  expect(mockQuery.mock.calls.at(-1)[1].variables.month).toBe('2026-09');
});

it('shows a loading skeleton without stale amounts or an error message', () => {
  mockQuery.mockReturnValue({
    loading: true,
    refetch: mockRefetch,
    data: {
      gaingeMonthlySales: {
        status: 'READY',
        month: '2026-10',
        total: 1234567,
        departments: [],
      },
    },
  });
  render(<StatusBoardSalesSection />);
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('status')).toHaveAccessibleName(
    '매출 정보를 불러오는 중입니다',
  );
  expect(screen.queryByText('1,234,567원')).not.toBeInTheDocument();
  expect(screen.queryByText(/조회 대기 또는 오류/)).not.toBeInTheDocument();
});
