export const readCashFlowCurrency = (value: unknown): number | null => {
  if (
    !value ||
    typeof value !== 'object' ||
    !('amountMicros' in value) ||
    !('currencyCode' in value) ||
    value.currencyCode !== 'KRW'
  )
    return null;
  const micros = value.amountMicros;
  if (
    (typeof micros !== 'number' && typeof micros !== 'string') ||
    micros === ''
  )
    return null;
  const number = Number(micros);
  return Number.isSafeInteger(number) ? number / 1_000_000 : null;
};
export const calculateCashFlow = ({
  banks,
  incoming,
  outgoing,
}: {
  banks: (number | null)[];
  incoming: number | null;
  outgoing: number | null;
}) => {
  const balance =
    banks.length === 3 &&
    banks.every((value) => value !== null && Number.isFinite(value))
      ? banks.reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : null;
  const safeIncoming =
    incoming !== null && Number.isFinite(incoming) ? incoming : null;
  const safeOutgoing =
    outgoing !== null && Number.isFinite(outgoing) ? outgoing : null;
  return {
    balance,
    incoming: safeIncoming,
    outgoing: safeOutgoing,
    available:
      balance !== null && safeIncoming !== null && safeOutgoing !== null
        ? balance + safeIncoming - safeOutgoing
        : null,
  };
};
