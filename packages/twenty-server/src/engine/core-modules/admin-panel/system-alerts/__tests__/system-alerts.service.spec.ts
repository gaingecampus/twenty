import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AppHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/app.health';
import { DatabaseHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/database.health';
import { RedisHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/redis.health';
import { WorkerHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/worker.health';
import { SystemAlertsService } from '../system-alerts.service';

describe('SystemAlertsService', () => {
  let directory: string;
  let service: SystemAlertsService;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'system-alerts-test-'));
    const indicator = { isHealthy: jest.fn().mockResolvedValue({}) };
    service = new SystemAlertsService(
      indicator as unknown as DatabaseHealthIndicator,
      indicator as unknown as RedisHealthIndicator,
      indicator as unknown as WorkerHealthIndicator,
      indicator as unknown as AppHealthIndicator,
    );
    Object.defineProperty(service, 'directory', { value: directory });
  });
  afterEach(async () => {
    service.onModuleDestroy();
    await rm(directory, { recursive: true, force: true });
  });
  const ready = async () =>
    writeFile(
      join(directory, 'status.json'),
      JSON.stringify({
        checkedAt: new Date().toISOString(),
        mailConfigured: true,
      }),
    );

  it('defaults to disabled, reports stale monitors and persists normalized unique recipients', async () => {
    expect(await service.getSettings()).toMatchObject({
      enabled: false,
      recipients: [],
      monitorRunning: false,
      mailConfigured: false,
    });
    await service.updateSettings({
      enabled: false,
      recipients: ['Luna@example.com', 'luna@example.com'],
    });
    expect((await service.getSettings()).recipients).toEqual([
      'luna@example.com',
    ]);
    await writeFile(
      join(directory, 'status.json'),
      JSON.stringify({
        checkedAt: new Date(Date.now() - 180_000).toISOString(),
        mailConfigured: true,
      }),
    );
    expect((await service.getSettings()).monitorRunning).toBe(false);
  });
  it('rejects malformed addresses and enabling without delivery prerequisites', async () => {
    await expect(
      service.updateSettings({
        enabled: false,
        recipients: ['bad\r\nbcc: x@example.com'],
      }),
    ).rejects.toThrow();
    await expect(
      service.updateSettings({
        enabled: true,
        recipients: ['luna@example.com'],
      }),
    ).rejects.toThrow();
    await ready();
    await expect(
      service.updateSettings({ enabled: true, recipients: [] }),
    ).rejects.toThrow();
    await service.updateSettings({
      enabled: true,
      recipients: ['luna@example.com'],
    });
    expect((await service.getSettings()).enabled).toBe(true);
  });
  it('keeps test rate limiting across ordinary settings saves', async () => {
    await ready();
    await service.updateSettings({
      enabled: false,
      recipients: ['luna@example.com'],
    });
    await service.requestTest();
    await service.updateSettings({
      enabled: false,
      recipients: ['luna@example.com'],
    });
    await expect(service.requestTest()).rejects.toThrow('1분');
    expect(
      JSON.parse(await readFile(join(directory, 'settings.json'), 'utf8'))
        .testRequest.id,
    ).toBeDefined();
  });
});
