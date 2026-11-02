import { getRecentWorkerMetrics } from 'src/engine/core-modules/admin-panel/utils/get-recent-worker-metrics.util';

const now = 1_800_000_000_000;
const metric = {
  meta: { count: 102, prevCount: 100, prevTS: now },
  data: [4, 3, 90],
  count: 10080,
};

describe('getRecentWorkerMetrics', () => {
  it('includes the unfinished current bucket and orders oldest to newest', () => {
    expect(getRecentWorkerMetrics(metric, 3, now)).toEqual([3, 4, 2]);
  });

  it('aligns idle series to wall clock instead of treating old points as current', () => {
    expect(getRecentWorkerMetrics(metric, 3, now + 60_000)).toEqual([4, 2, 0]);
    expect(getRecentWorkerMetrics(metric, 3, now + 180_000)).toEqual([0, 0, 0]);
  });

  it('expires on the minute boundary', () => {
    expect(getRecentWorkerMetrics(metric, 1, now + 59_999)).toEqual([2]);
    expect(getRecentWorkerMetrics(metric, 1, now + 60_000)).toEqual([0]);
  });

  it('supports queues with no metrics yet', () => {
    expect(
      getRecentWorkerMetrics(
        { meta: { count: 0, prevCount: 0, prevTS: 0 }, data: [], count: 0 },
        3,
        now,
      ),
    ).toEqual([0, 0, 0]);
  });

  it('does not silently classify invalid timestamps or counters as healthy', () => {
    expect(() =>
      getRecentWorkerMetrics(
        { ...metric, meta: { ...metric.meta, prevTS: 0 } },
        3,
        now,
      ),
    ).toThrow('Invalid worker metrics');
    expect(() => getRecentWorkerMetrics(metric, 3, now - 60_000)).toThrow(
      'future',
    );
    expect(() =>
      getRecentWorkerMetrics({ ...metric, data: [NaN] }, 3, now),
    ).toThrow('Invalid worker metrics');
  });
});
