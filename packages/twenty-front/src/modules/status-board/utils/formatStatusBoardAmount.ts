import { isDefined } from 'twenty-shared/utils';

export const formatStatusBoardAmount = (
  amountMicros: number | null | undefined,
): string => {
  if (!isDefined(amountMicros)) {
    return '—';
  }

  const won = amountMicros / 1_000_000;

  if (won >= 100_000_000) {
    return `${(Math.round(won / 10_000_000) / 10).toLocaleString('ko-KR')}억`;
  }

  if (won >= 10_000) {
    return `${Math.round(won / 10_000).toLocaleString('ko-KR')}만`;
  }

  return `${won.toLocaleString('ko-KR')}원`;
};

export const getStatusBoardAmountMicros = (value: unknown): number | null => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'amountMicros' in value &&
    typeof value.amountMicros === 'number'
  ) {
    return value.amountMicros;
  }

  return null;
};
