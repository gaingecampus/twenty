export const getPersonalDashboardComparison = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const previous = new Date(Date.UTC(year, month - 2, 1));
  const previousYear = previous.getUTCFullYear();
  const previousMonth = previous.getUTCMonth() + 1;
  const previousDay = Math.min(
    day,
    new Date(Date.UTC(previousYear, previousMonth, 0)).getUTCDate(),
  );
  const date = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return {
    currentStart: date(year, month, 1),
    currentEnd: date(year, month, day),
    previousStart: date(previousYear, previousMonth, 1),
    previousEnd: date(previousYear, previousMonth, previousDay),
  };
};

export const formatPersonalDashboardGrowth = (
  current: number,
  previous: number,
) => {
  if (previous === 0) return current === 0 ? '변동 없음' : '신규 발생';
  const percent = ((current - previous) / previous) * 100;
  if (percent === 0) return '변동 없음';
  return `${percent > 0 ? '+' : ''}${percent.toLocaleString('ko-KR', {
    maximumFractionDigits: 1,
  })}%`;
};
