import { type HealthIndicatorResult } from '@nestjs/terminus';

import { type SystemAlertIssue } from './system-alerts.types';

const numeric = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};

export const evaluateSystemAlerts = (
  results: {
    key: string;
    label: string;
    result: PromiseSettledResult<HealthIndicatorResult>;
  }[],
): SystemAlertIssue[] => {
  const issues: SystemAlertIssue[] = [];

  for (const { key, label, result } of results) {
    const health =
      result.status === 'fulfilled' ? result.value[key] : undefined;
    if (!health || health.status !== 'up') {
      issues.push({
        key: `${key}.down`,
        label,
        detail: '서비스 상태 점검 실패',
      });
      continue;
    }
    const details = object(health.details);
    if (key === 'database') {
      const connections = numeric(
        object(details.connections).utilizationPercent,
      );
      if (connections !== undefined && connections >= 90) {
        issues.push({
          key: 'database.connections',
          label: 'DB 연결 부족',
          detail: `연결 사용률 ${connections}% (기준 90%)`,
        });
      }
      const storage = object(details.storage);
      const total = numeric(storage.totalBytes);
      const available = numeric(storage.availableBytes);
      if (total && available !== undefined && available / total <= 0.1) {
        issues.push({
          key: 'database.storage',
          label: 'DB 저장 공간 부족',
          detail: `여유 공간 ${((available / total) * 100).toFixed(1)}% (기준 10%)`,
        });
      }
      if (storage.source !== 'unsupported' && storage.status !== 'available') {
        issues.push({
          key: 'database.storage-monitor',
          label: 'DB 용량 수집 실패',
          detail:
            '저장 공간을 확인할 수 없습니다. 조회 권한과 수집 설정을 확인하세요.',
        });
      }
    }
    if (key === 'redis') {
      const memory = object(details.memory);
      const used = numeric(memory.usedBytes);
      const limit = numeric(memory.limitBytes);
      if (limit && used !== undefined && used / limit >= 0.9) {
        issues.push({
          key: 'redis.memory',
          label: 'Redis 메모리 부족',
          detail: `설정 한도 대비 ${((used / limit) * 100).toFixed(1)}% (기준 90%)`,
        });
      }
    }
    if (key === 'app') {
      const storage = object(details.storage);
      const total = numeric(storage.totalBytes);
      const available = numeric(storage.availableBytes);

      if (total && available !== undefined && available / total <= 0.1) {
        issues.push({
          key: 'app.storage',
          label: '서버 저장 공간 부족',
          detail: `여유 공간 ${((available / total) * 100).toFixed(1)}% (기준 10%)`,
        });
      }
      if (storage.status === 'unavailable') {
        issues.push({
          key: 'app.storage-monitor',
          label: '서버 용량 수집 실패',
          detail: '앱 실행 경로의 파일시스템 용량을 확인할 수 없습니다.',
        });
      }
      const cpu = numeric(object(details.runtime).cpuPercent);
      if (cpu !== undefined && cpu >= 90) {
        issues.push({
          key: 'app.cpu',
          label: 'API CPU 사용량 높음',
          detail: `CPU ${cpu}% (1코어 기준, 경고 90%)`,
        });
      }
    }
  }
  return issues;
};
