export const formatToShortNumber = (
  amount: number,
  {
    decimals = 1,
    locale = 'ko-KR',
  }: { decimals?: number; locale?: string } = {},
): string => {
  if (!Number.isFinite(amount)) return String(amount);

  const units = ['', '만', '억', '조', '경'];
  const absoluteAmount = Math.abs(amount);
  let unitIndex = 0;
  let divisor = 1;

  // Promote after rounding so a boundary never renders as 10,000만.
  while (
    unitIndex < units.length - 1 &&
    Number((absoluteAmount / divisor).toFixed(decimals)) >= 10_000
  ) {
    divisor *= 10_000;
    unitIndex += 1;
  }

  const rounded = Number((absoluteAmount / divisor).toFixed(decimals));
  const sign = amount < 0 && rounded !== 0 ? '-' : '';
  return (
    sign +
    rounded.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }) +
    units[unitIndex]
  );
};
