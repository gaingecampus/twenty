export type StatusBoardPeriodType = 'month' | 'quarter' | 'year';

export type StatusBoardPeriodRange = {
  startDate: string;
  endDate: string;
  label: string;
  title: string;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getStatusBoardPeriodRange = ({
  periodType,
  offset,
  now = new Date(),
}: {
  periodType: StatusBoardPeriodType;
  offset: number;
  now?: Date;
}): StatusBoardPeriodRange => {
  const year = now.getFullYear();
  const month = now.getMonth();

  if (periodType === 'month') {
    const start = new Date(year, month + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    return {
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
      label: `${start.getFullYear()}년 ${start.getMonth() + 1}월`,
      title: offset === 0 ? '이번 달' : `${start.getMonth() + 1}월`,
    };
  }

  if (periodType === 'quarter') {
    const quarterIndex = Math.floor(month / 3) + offset;
    const start = new Date(year, quarterIndex * 3, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
    const quarter = Math.floor(start.getMonth() / 3) + 1;

    return {
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
      label: `${start.getFullYear()}년 ${quarter}분기`,
      title: offset === 0 ? '이번 분기' : `${quarter}분기`,
    };
  }

  const start = new Date(year + offset, 0, 1);
  const end = new Date(year + offset, 11, 31);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    label: `${year + offset}년`,
    title: offset === 0 ? '올해' : `${year + offset}년`,
  };
};

export const getStatusBoardTodayIsoDate = (now = new Date()): string => {
  return toIsoDate(now);
};

export const getStatusBoardMonthRange = (now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};
