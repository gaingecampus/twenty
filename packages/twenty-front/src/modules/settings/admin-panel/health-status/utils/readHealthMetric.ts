import { isDefined } from 'twenty-shared/utils';

export const parseHealthDetails = (
  serialized: string | null | undefined,
): unknown => {
  try {
    const parsed: unknown = JSON.parse(serialized ?? '{}');

    return isDefined(parsed) &&
      typeof parsed === 'object' &&
      'details' in parsed
      ? parsed.details
      : undefined;
  } catch {
    return undefined;
  }
};

export const readHealthMetric = (
  details: unknown,
  path: string,
  format?: 'bytes' | 'seconds' | 'percent',
): string => {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (!isDefined(current) || typeof current !== 'object') return undefined;

    return (current as Record<string, unknown>)[key];
  }, details);

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (format === 'bytes') {
      return value >= 1024 ** 3
        ? `${(value / 1024 ** 3).toFixed(1)} GiB`
        : `${(value / 1024 ** 2).toFixed(1)} MiB`;
    }
    if (format === 'percent') return `${value.toFixed(1)}%`;
    if (format === 'seconds') {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);

      return `${hours}h ${minutes}m`;
    }

    return value.toLocaleString();
  }

  return typeof value === 'string' && value.length > 0 && value !== 'N/A'
    ? value
    : '—';
};
