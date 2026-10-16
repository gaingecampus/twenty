import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { ResponsiveLine } from '@nivo/line';
import { useContext, useState } from 'react';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

import {
  GAINGE_SALES_TIMELINE,
  type GaingeSalesTimeline,
} from '@/status-board/graphql/gaingeMonthlySales';
import { StyledDashboardMuted } from '@/ui/layout/dashboard/components/dashboardStyled';

const StyledChart = styled.div`
  height: 320px;
  min-width: 0;
`;
const StyledLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  button {
    align-items: center;
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: ${themeCssVariables.border.radius.sm};
    color: ${themeCssVariables.font.color.primary};
    cursor: pointer;
    display: inline-flex;
    gap: 6px;
    padding: 6px 8px;
  }
  button[aria-pressed='false'] {
    color: ${themeCssVariables.font.color.tertiary};
    text-decoration: line-through;
  }
`;
const StyledTooltip = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  font-size: 12px;
  padding: 12px;
  pointer-events: none;
  width: max-content;
  td {
    padding: 4px;
    white-space: nowrap;
  }
  td:not(:first-child) {
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
`;

export const StatusBoardSalesChart = ({ month }: { month: string }) => {
  const { theme } = useContext(ThemeContext);
  const [hidden, setHidden] = useState<string[]>([]);
  const { data, loading, error } = useQuery<{
    gaingeSalesTimeline: GaingeSalesTimeline;
  }>(GAINGE_SALES_TIMELINE, {
    variables: { month },
    fetchPolicy: 'network-only',
  });
  const report = data?.gaingeSalesTimeline;

  if (loading)
    return (
      <StyledDashboardMuted role="status">
        일별 누적 그래프를 불러오는 중입니다…
      </StyledDashboardMuted>
    );
  if (error || report?.status !== 'READY' || !report.days?.length) {
    return (
      <StyledDashboardMuted role="status">
        일별 그래프를 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요.
      </StyledDashboardMuted>
    );
  }
  const days = report.days;
  const labels = Array.from(
    new Set(days.flatMap((day) => day.departments.map((item) => item.label))),
  );
  const colors = [
    theme.color.blue,
    theme.color.green,
    theme.color.orange,
    theme.color.purple,
    theme.color.red,
    theme.color.turquoise,
    theme.color.yellow,
    theme.color.pink,
    theme.color.bronze,
    theme.color.cyan,
    theme.color.lime,
  ];
  const colorFor = (label: string) =>
    colors[labels.indexOf(label) % colors.length];
  const series = labels
    .filter((label) => !hidden.includes(label))
    .map((label) => ({
      id: label,
      data: days.map((day) => ({
        x: day.date,
        y: day.departments.find((item) => item.label === label)?.amount ?? 0,
      })),
    }));

  return (
    <div aria-label="사업부별 일별 누적 매출 그래프">
      <StyledLegend aria-label="표시할 사업부">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            aria-pressed={!hidden.includes(label)}
            onClick={() =>
              setHidden((previous) =>
                previous.includes(label)
                  ? previous.filter((item) => item !== label)
                  : [...previous, label],
              )
            }
          >
            <span aria-hidden style={{ color: colorFor(label) }}>
              ●
            </span>
            {label}
          </button>
        ))}
      </StyledLegend>
      {series.length ? (
        <StyledChart>
          <ResponsiveLine
            data={series}
            margin={{ top: 20, right: 16, bottom: 42, left: 62 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 0, max: 'auto', stacked: true }}
            curve="linear"
            enableArea
            areaOpacity={0.18}
            enablePoints={days.length === 1}
            pointSize={6}
            enableGridX={false}
            colors={(serie) => colorFor(String(serie.id))}
            enableSlices="x"
            animate={false}
            axisBottom={{
              tickValues: days
                .filter(
                  (_, index) =>
                    index % Math.max(1, Math.ceil(days.length / 7)) === 0 ||
                    index === days.length - 1,
                )
                .map((day) => day.date),
              format: (value) => `${String(value).slice(8)}일`,
            }}
            axisLeft={{
              tickValues: 5,
              format: (value) =>
                `${(Number(value) / 10000).toLocaleString('ko-KR')}만`,
            }}
            theme={{
              text: { fill: theme.font.color.secondary, fontSize: 11 },
              grid: { line: { stroke: theme.border.color.light } },
            }}
            sliceTooltip={({ slice }) => {
              const day = days.find(
                (item) => item.date === String(slice.points[0]?.data.x),
              );
              if (!day) return null;
              return (
                <StyledTooltip>
                  <strong>{day.date} · 누적 매출</strong>
                  <table>
                    <tbody>
                      {day.departments
                        .filter((item) => !hidden.includes(item.label))
                        .map((item) => (
                          <tr key={item.label}>
                            <td>
                              <span style={{ color: colorFor(item.label) }}>
                                ●
                              </span>{' '}
                              {item.label}
                            </td>
                            <td>{item.amount.toLocaleString('ko-KR')}원</td>
                            <td>
                              {(day.total
                                ? (item.amount / day.total) * 100
                                : 0
                              ).toFixed(2)}
                              %
                            </td>
                          </tr>
                        ))}
                      <tr>
                        <td>전체 매출</td>
                        <td>{day.total.toLocaleString('ko-KR')}원</td>
                        <td>{day.total ? '100.00%' : '0.00%'}</td>
                      </tr>
                    </tbody>
                  </table>
                </StyledTooltip>
              );
            }}
            role="img"
            ariaLabel="날짜별 사업부 누적 매출. 사업부 버튼으로 표시를 선택하고 그래프에 마우스를 올리면 금액과 전체 대비 비중을 확인할 수 있습니다."
          />
        </StyledChart>
      ) : (
        <StyledDashboardMuted>
          표시할 사업부를 선택해 주세요.
        </StyledDashboardMuted>
      )}
    </div>
  );
};
