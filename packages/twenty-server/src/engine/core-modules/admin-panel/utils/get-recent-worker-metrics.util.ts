import { type Metrics } from 'bullmq';

// BullMQ only advances its minute buckets when another job finishes.
// Align each series independently to now so idle queues age out old failures.
export const getRecentWorkerMetrics = (
  metrics: Metrics,
  minutes: number,
  now: number,
): number[] => {
  const result = Array<number>(minutes).fill(0);
  const { count, prevCount, prevTS } = metrics.meta;

  if (count === 0) return result;
  if (![count, prevCount, prevTS].every(Number.isFinite) || prevTS <= 0) {
    throw new Error('Invalid worker metrics');
  }

  const age = Math.floor(now / 60_000) - Math.floor(prevTS / 60_000);

  if (age < 0) throw new Error('Worker metrics timestamp is in the future');
  if (age >= minutes) return result;

  result[minutes - 1 - age] = Math.max(0, count - prevCount);
  metrics.data.slice(0, minutes - 1 - age).forEach((value, index) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      throw new Error('Invalid worker metrics');
    }
    result[minutes - 2 - age - index] = numericValue;
  });

  return result;
};
