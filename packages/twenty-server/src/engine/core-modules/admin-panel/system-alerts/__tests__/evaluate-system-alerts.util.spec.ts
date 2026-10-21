import { type HealthIndicatorResult } from '@nestjs/terminus';

import { evaluateSystemAlerts } from '../evaluate-system-alerts.util';

const result = (key: string, details: Record<string, unknown>) => ({
  key,
  label: key,
  result: {
    status: 'fulfilled',
    value: { [key]: { status: 'up', details } },
  } as PromiseFulfilledResult<HealthIndicatorResult>,
});

describe('evaluateSystemAlerts', () => {
  it('detects exact resource boundaries including zero disk space', () => {
    const issues = evaluateSystemAlerts([
      result('database', {
        connections: { utilizationPercent: 90 },
        storage: {
          source: 'rds',
          status: 'available',
          totalBytes: 100,
          availableBytes: 0,
        },
      }),
      result('redis', { memory: { usedBytes: 90, limitBytes: 100 } }),
      result('app', { runtime: { cpuPercent: 90 } }),
    ]);
    expect(issues.map((issue) => issue.key)).toEqual([
      'database.connections',
      'database.storage',
      'redis.memory',
      'app.cpu',
    ]);
  });
  it('does not treat an unlimited Redis configuration as zero capacity', () => {
    expect(
      evaluateSystemAlerts([
        result('redis', { memory: { usedBytes: 100, limitBytes: 0 } }),
      ]),
    ).toEqual([]);
  });
  it.each([0, 10])(
    'alerts when server disk available space is %s percent',
    (availableBytes) => {
      expect(
        evaluateSystemAlerts([
          result('app', {
            storage: { status: 'available', totalBytes: 100, availableBytes },
          }),
        ]).map((issue) => issue.key),
      ).toEqual(['app.storage']);
    },
  );
  it('reports storage collection failure separately and accepts healthy capacity', () => {
    expect(
      evaluateSystemAlerts([
        result('app', { storage: { status: 'unavailable' } }),
      ]).map((issue) => issue.key),
    ).toEqual(['app.storage-monitor']);
    expect(
      evaluateSystemAlerts([
        result('app', {
          storage: { status: 'available', totalBytes: 100, availableBytes: 11 },
        }),
      ]),
    ).toEqual([]);
  });
  it('reports rejected, missing and down health checks', () => {
    const failed: PromiseRejectedResult = {
      status: 'rejected',
      reason: Error('secret connection URL'),
    };
    const issues = evaluateSystemAlerts([
      { key: 'database', label: 'DB', result: failed },
    ]);
    expect(issues[0].key).toBe('database.down');
    expect(JSON.stringify(issues)).not.toContain('secret');
  });
  it('reports unavailable volume monitoring without reporting the DB itself as down', () => {
    expect(
      evaluateSystemAlerts([
        result('database', { storage: { source: 'rds', status: 'partial' } }),
      ])[0].key,
    ).toBe('database.storage-monitor');
  });
});
