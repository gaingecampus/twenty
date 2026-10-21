import {
  parseHealthDetails,
  readHealthMetric,
} from '@/settings/admin-panel/health-status/utils/readHealthMetric';

describe('health metrics', () => {
  it('reads the serialized admin health envelope and preserves zero', () => {
    const details = parseHealthDetails(
      JSON.stringify({ details: { connections: { active: 0 } } }),
    );

    expect(readHealthMetric(details, 'connections.active')).toBe('0');
  });

  it.each([undefined, null, '', '{broken', 'null', '[]'])(
    'handles unavailable details: %s',
    (serialized) => {
      expect(
        readHealthMetric(
          parseHealthDetails(serialized),
          'runtime.cpuPercent',
          'percent',
        ),
      ).toBe('—');
    },
  );

  it.each([null, undefined, NaN, Infinity, {}, 'N/A'])(
    'does not turn missing or invalid metrics into zero: %s',
    (value) => {
      expect(readHealthMetric({ value }, 'value')).toBe('—');
    },
  );

  it('formats volume capacity in GiB without confusing it with database size', () => {
    expect(readHealthMetric({ size: 20 * 1024 ** 3 }, 'size', 'bytes')).toBe(
      '20.0 GiB',
    );
  });

  it('formats process metrics with explicit units', () => {
    expect(readHealthMetric({ value: 1048576 }, 'value', 'bytes')).toBe(
      '1.0 MiB',
    );
    expect(readHealthMetric({ value: 3660 }, 'value', 'seconds')).toBe('1h 1m');
    expect(readHealthMetric({ value: 25.25 }, 'value', 'percent')).toBe(
      '25.3%',
    );
  });

  it('does not display the last healthy sample as current on an outage', () => {
    const details = parseHealthDetails(
      JSON.stringify({
        details: { stateHistory: { details: { connections: { active: 12 } } } },
      }),
    );

    expect(readHealthMetric(details, 'connections.active')).toBe('—');
  });
});
