import { differenceInCalendarDays, parseISO } from 'date-fns';

export const getStatusBoardContractProgress = (
  start: unknown,
  end: unknown,
  today = new Date(),
) => {
  if (typeof start !== 'string' || typeof end !== 'string') return undefined;
  const startDate = parseISO(start.slice(0, 10));
  const endDate = parseISO(end.slice(0, 10));
  const total = differenceInCalendarDays(endDate, startDate);
  if (!Number.isFinite(total) || total < 0) return undefined;
  const remaining = differenceInCalendarDays(endDate, today);
  const elapsed = differenceInCalendarDays(today, startDate);
  return {
    remaining,
    percent:
      total === 0
        ? remaining <= 0
          ? 100
          : 0
        : Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))),
  };
};
