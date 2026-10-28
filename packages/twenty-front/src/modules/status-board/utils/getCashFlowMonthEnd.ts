export const getCashFlowMonthEnd = (today: string): string => {
  const [year, month] = today.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
};
