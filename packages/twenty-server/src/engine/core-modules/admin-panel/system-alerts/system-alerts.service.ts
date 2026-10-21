import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import isEmail from 'validator/lib/isEmail';

import { AppHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/app.health';
import { DatabaseHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/database.health';
import { RedisHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/redis.health';
import { WorkerHealthIndicator } from 'src/engine/core-modules/admin-panel/indicators/worker.health';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { evaluateSystemAlerts } from './evaluate-system-alerts.util';
import {
  type SystemAlertSettingsDTO,
  type UpdateSystemAlertSettingsInput,
} from './system-alert-settings.dto';
import {
  type SystemAlertSettings,
  type SystemAlertMonitorStatus,
} from './system-alerts.types';

@Injectable()
export class SystemAlertsService implements OnModuleDestroy {
  private readonly logger = new Logger(SystemAlertsService.name);
  private readonly directory = resolve('.local-storage/system-alerts');
  private timer?: ReturnType<typeof setInterval>;
  private collecting = false;
  private writing = false;

  constructor(
    private readonly database: DatabaseHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly worker: WorkerHealthIndicator,
    private readonly app: AppHealthIndicator,
  ) {}

  private async read<T>(name: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(
        await readFile(join(this.directory, name), 'utf8'),
      ) as T;
    } catch (error) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      )
        return fallback;
      throw error;
    }
  }

  private async write(name: string, value: unknown) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const temporary = join(this.directory, `${name}.${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
    await rename(temporary, join(this.directory, name));
  }

  async getSettings(): Promise<SystemAlertSettingsDTO> {
    const settings = await this.read<SystemAlertSettings>('settings.json', {
      enabled: false,
      recipients: [],
    });
    const status = await this.read<SystemAlertMonitorStatus>('status.json', {});
    const age = Date.now() - Date.parse(status.checkedAt ?? '');
    return {
      enabled: settings.enabled,
      recipients: settings.recipients,
      monitorRunning: Number.isFinite(age) && age >= 0 && age < 120_000,
      mailConfigured: status.mailConfigured === true,
      lastCheckedAt: status.checkedAt,
      lastSentAt: status.lastSentAt,
      lastError: status.lastError,
      lastTestAt: status.lastTestAt,
      activeIssues:
        status.activeIssues?.map(
          (issue) => `${issue.label}: ${issue.detail}`,
        ) ?? [],
    };
  }

  async updateSettings(
    input: UpdateSystemAlertSettingsInput,
  ): Promise<SystemAlertSettingsDTO> {
    if (this.writing)
      throw new UserInputError(
        '다른 설정을 저장 중입니다. 다시 시도해 주세요.',
      );
    this.writing = true;
    try {
      const recipients = [
        ...new Set(input.recipients.map((email) => email.trim().toLowerCase())),
      ];
      if (
        recipients.length > 20 ||
        recipients.some((email) => !isEmail(email) || email.length > 254)
      ) {
        throw new UserInputError(
          '올바른 이메일을 최대 20개까지 등록할 수 있습니다.',
        );
      }
      const status = await this.getSettings();
      if (
        input.enabled &&
        (!recipients.length || !status.monitorRunning || !status.mailConfigured)
      ) {
        throw new UserInputError(
          '수신자 등록과 감시 프로세스·SMTP 설정을 먼저 완료해 주세요.',
        );
      }
      const previous = await this.read<SystemAlertSettings>('settings.json', {
        enabled: false,
        recipients: [],
      });
      await this.write('settings.json', {
        enabled: input.enabled,
        recipients,
        testRequest: previous.testRequest,
      });
      return this.getSettings();
    } finally {
      this.writing = false;
    }
  }

  async requestTest(): Promise<boolean> {
    if (this.writing)
      throw new UserInputError('설정 저장 후 다시 시도해 주세요.');
    this.writing = true;
    try {
      const settings = await this.read<SystemAlertSettings>('settings.json', {
        enabled: false,
        recipients: [],
      });
      const status = await this.getSettings();
      if (
        !settings.recipients.length ||
        !status.monitorRunning ||
        !status.mailConfigured
      ) {
        throw new UserInputError(
          '저장된 수신자와 감시 프로세스·SMTP 설정이 필요합니다.',
        );
      }
      if (
        settings.testRequest &&
        Date.now() - Date.parse(settings.testRequest.createdAt) < 60_000
      ) {
        throw new UserInputError(
          '테스트 메일은 1분에 한 번 요청할 수 있습니다.',
        );
      }
      await this.write('settings.json', {
        ...settings,
        testRequest: { id: randomUUID(), createdAt: new Date().toISOString() },
      });
      return true;
    } finally {
      this.writing = false;
    }
  }

  // Only the HTTP bootstrap starts collection; workers and CLI contexts do not.
  start() {
    if (this.timer) return;
    void this.collect();
    this.timer = setInterval(() => void this.collect(), 60_000);
    this.timer.unref();
  }

  private async collect() {
    if (this.collecting) return;
    this.collecting = true;
    try {
      const indicators = [
        { key: 'database', label: 'PostgreSQL', indicator: this.database },
        { key: 'redis', label: 'Redis', indicator: this.redis },
        { key: 'worker', label: '백그라운드 워커', indicator: this.worker },
        { key: 'app', label: 'API 서버', indicator: this.app },
      ];
      const results = await Promise.allSettled(
        indicators.map(({ indicator }) => indicator.isHealthy()),
      );
      await this.write('snapshot.json', {
        checkedAt: new Date().toISOString(),
        issues: evaluateSystemAlerts(
          indicators.map(({ key, label }, index) => ({
            key,
            label,
            result: results[index],
          })),
        ),
      });
    } catch {
      this.logger.warn('System alert metrics collection failed');
    } finally {
      this.collecting = false;
    }
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }
}
