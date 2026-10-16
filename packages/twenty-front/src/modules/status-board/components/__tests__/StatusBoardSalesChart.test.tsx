import { fireEvent, render, screen } from '@testing-library/react';
import { StatusBoardSalesChart } from '@/status-board/components/StatusBoardSalesChart';

const mockQuery = jest.fn();
const mockChart = jest.fn();
jest.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => mockQuery(...args),
}));
jest.mock('@nivo/line', () => ({
  ResponsiveLine: (props: unknown) => {
    mockChart(props);
    return <div data-testid="chart" />;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockReturnValue({
    data: {
      gaingeSalesTimeline: {
        status: 'READY',
        month: '2026-10',
        days: [
          {
            date: '2026-10-01',
            total: 100,
            departments: [{ label: '1BU', amount: 100 }],
          },
          {
            date: '2026-10-02',
            total: 200,
            departments: [
              { label: '1BU', amount: 150 },
              { label: 'AX센터', amount: 50 },
            ],
          },
        ],
      },
    },
  });
});
it('keeps daily totals as values and retains stable colors when toggling a department', () => {
  render(<StatusBoardSalesChart month="2026-10" />);
  const props = mockChart.mock.calls.at(-1)[0];
  expect(props.data).toEqual([
    {
      id: '1BU',
      data: [
        { x: '2026-10-01', y: 100 },
        { x: '2026-10-02', y: 150 },
      ],
    },
    {
      id: 'AX센터',
      data: [
        { x: '2026-10-01', y: 0 },
        { x: '2026-10-02', y: 50 },
      ],
    },
  ]);
  fireEvent.click(screen.getByRole('button', { name: '1BU' }));
  const filtered = mockChart.mock.calls.at(-1)[0];
  expect(filtered.data).toHaveLength(1);
  expect(filtered.colors({ id: 'AX센터' })).toBe(
    props.colors({ id: 'AX센터' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'AX센터' }));
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  expect(
    screen.getByText('표시할 사업부를 선택해 주세요.'),
  ).toBeInTheDocument();
});
it('shows raw department amounts and company-wide percentages, not stacked coordinates', () => {
  render(<StatusBoardSalesChart month="2026-10" />);
  const props = mockChart.mock.calls.at(-1)[0];
  render(
    props.sliceTooltip({
      slice: { points: [{ data: { x: '2026-10-02', y: 200 } }] },
    }),
  );
  expect(screen.getByText('150원')).toBeInTheDocument();
  expect(screen.getByText('75.00%')).toBeInTheDocument();
  expect(screen.getByText('25.00%')).toBeInTheDocument();
  expect(screen.getByText('200원')).toBeInTheDocument();
});
it('does not render a curve for unavailable data', () => {
  mockQuery.mockReturnValue({
    data: { gaingeSalesTimeline: { status: 'UNAVAILABLE' } },
  });
  render(<StatusBoardSalesChart month="2026-10" />);
  expect(screen.getByRole('status')).toHaveTextContent('불러오지 못했습니다');
  expect(mockChart).not.toHaveBeenCalled();
});
