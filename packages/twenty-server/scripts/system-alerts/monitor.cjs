// Independent of Nest, PostgreSQL and Redis so dependency outages can be reported.
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const nodemailer = require('nodemailer');

const INTERVAL = 60_000;
const STALE_AFTER = 150_000;
const directory = path.resolve(
  process.env.SYSTEM_ALERTS_DIRECTORY || '.local-storage/system-alerts',
);

async function readJson(name, fallback, root = directory) {
  try {
    return JSON.parse(await fs.readFile(path.join(root, name), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}
async function writeJson(name, value, root = directory) {
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const temporary = path.join(root, `${name}.${randomUUID()}.tmp`);
  await fs.writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
  await fs.rename(temporary, path.join(root, name));
}

function smtpConfiguration(env) {
  const host = env.SYSTEM_ALERT_SMTP_HOST || env.EMAIL_SMTP_HOST;
  const from = env.SYSTEM_ALERT_FROM_ADDRESS || env.EMAIL_FROM_ADDRESS;
  const user = env.SYSTEM_ALERT_SMTP_USER || env.EMAIL_SMTP_USER;
  const pass = env.SYSTEM_ALERT_SMTP_PASSWORD || env.EMAIL_SMTP_PASSWORD;
  if (!host || !from || /[\r\n]/.test(from)) return null;
  const port = Number(env.SYSTEM_ALERT_SMTP_PORT || env.EMAIL_SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return {
    from,
    options: {
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    },
  };
}

function currentIssues(snapshot, apiAvailable, now) {
  const issues = [];
  if (!apiAvailable)
    issues.push({
      key: 'api.unavailable',
      label: 'API 응답 불가',
      detail: 'API 준비 상태 점검이 실패했습니다.',
    });
  const age = now - Date.parse(snapshot?.checkedAt || '');
  if (
    !Number.isFinite(age) ||
    age < 0 ||
    age > STALE_AFTER ||
    !Array.isArray(snapshot.issues)
  ) {
    issues.push({
      key: 'monitor.stale',
      label: '지표 수집 중단',
      detail:
        '최근 150초 이내 지표가 없습니다. 서버와 수집 프로세스를 확인하세요.',
    });
  } else {
    issues.push(...snapshot.issues);
  }
  return issues;
}

// Persist incident and recipient delivery state, including failed deliveries.
async function evaluateAndSend({
  settings,
  issues,
  state,
  now,
  send,
  persist,
}) {
  state.incidents ||= {};
  state.tests ||= {};
  let failed = false;
  if (!settings.enabled) {
    state.incidents = {};
  } else {
    const observed = new Map(issues.map((issue) => [issue.key, issue]));
    const metricsUnavailable = observed.has('monitor.stale');
    for (const [key, incident] of Object.entries(state.incidents)) {
      if (!observed.has(key)) {
        // Missing measurements must never be treated as a recovery.
        if (
          (metricsUnavailable &&
            key !== 'api.unavailable' &&
            key !== 'monitor.stale') ||
          observed.has(`${key.split('.')[0]}.down`) ||
          (key === 'database.storage' &&
            observed.has('database.storage-monitor')) ||
          (key === 'app.storage' && observed.has('app.storage-monitor'))
        ) {
          incident.good = 0;
          incident.bad = 0;
          continue;
        }
        incident.good = (incident.good || 0) + 1;
        incident.bad = 0;
      }
    }
    for (const issue of issues) {
      const incident = (state.incidents[issue.key] ||= {
        bad: 0,
        good: 0,
        delivered: {},
        openedAt: new Date(now).toISOString(),
      });
      incident.issue = issue;
      incident.bad += 1;
      incident.good = 0;
    }
    for (const recipient of settings.recipients) {
      const pending = Object.entries(state.incidents).filter(([, incident]) => {
        if (incident.good >= 2) return Boolean(incident.delivered[recipient]);
        return incident.bad >= 2 && !incident.delivered[recipient];
      });
      if (!pending.length) continue;
      try {
        const kind = pending.every(([, incident]) => incident.good >= 2)
          ? '복구'
          : '장애';
        const body = pending
          .map(
            ([, incident]) =>
              `${incident.good >= 2 ? '[복구]' : '[장애]'} ${incident.issue.label}\n${incident.issue.detail}\n최초 감지: ${incident.openedAt}`,
          )
          .join('\n\n');
        await send(
          recipient,
          kind,
          `${body}\n확인 시각: ${new Date(now).toISOString()}`,
        );
        for (const [, incident] of pending) {
          if (incident.good >= 2) delete incident.delivered[recipient];
          else incident.delivered[recipient] = true;
        }
        state.lastSentAt = new Date(now).toISOString();
        await persist(state);
      } catch {
        failed = true;
      }
    }
    for (const [key, incident] of Object.entries(state.incidents)) {
      if (
        incident.good >= 2 &&
        !settings.recipients.some((recipient) => incident.delivered[recipient])
      )
        delete state.incidents[key];
    }
  }
  const request = settings.testRequest;
  if (
    request &&
    state.completedTestId !== request.id &&
    now - Date.parse(request.createdAt) >= 0 &&
    now - Date.parse(request.createdAt) < 600_000
  ) {
    if (state.testId !== request.id) {
      state.testId = request.id;
      state.tests = {};
    }
    for (const recipient of settings.recipients) {
      if (state.tests[recipient]) continue;
      try {
        await send(
          recipient,
          '테스트',
          '이 주소는 시스템 장애 알림 수신자로 등록되어 있습니다. 장애 감지와 복구 시 알림을 받습니다.',
        );
        state.tests[recipient] = true;
        state.lastSentAt = new Date(now).toISOString();
        await persist(state);
      } catch {
        failed = true;
      }
    }
    if (
      settings.recipients.length &&
      settings.recipients.every((recipient) => state.tests[recipient]) &&
      state.completedTestId !== request.id
    ) {
      state.lastTestAt = new Date(now).toISOString();
      state.completedTestId = request.id;
    }
  }
  state.lastError = failed
    ? '일부 메일을 발송하지 못했습니다. SMTP 설정과 수신 주소를 확인하세요. 다음 점검에서 재시도합니다.'
    : undefined;
  await persist(state);
  return state;
}

async function run() {
  const owner = randomUUID();
  const lock = path.join(directory, 'monitor.lock');
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  let stopped = false;
  let ownsLock = false;
  const stop = () => {
    stopped = true;
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  async function claim() {
    try {
      await fs.mkdir(lock);
      await writeJson('owner.json', { owner, updatedAt: Date.now() }, lock);
      ownsLock = true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const current = await readJson('owner.json', null, lock);
      const updatedAt = current?.updatedAt || (await fs.stat(lock)).mtimeMs;
      if (Date.now() - updatedAt > 180_000)
        await fs.rm(lock, { recursive: true, force: true });
      return false;
    }
    return true;
  }
  async function renew() {
    if ((await readJson('owner.json', {}, lock)).owner !== owner) {
      ownsLock = false;
      throw new Error('monitor lease lost');
    }
    await writeJson('owner.json', { owner, updatedAt: Date.now() }, lock);
  }
  while (!stopped) {
    try {
      if (!ownsLock && !(await claim())) {
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        continue;
      }
      await renew();
      const settings = await readJson('settings.json', {
        enabled: false,
        recipients: [],
      });
      const snapshot = await readJson('snapshot.json', null);
      const state = await readJson('delivery.json', {});
      const mail = smtpConfiguration(process.env);
      let apiAvailable = false;
      try {
        const response = await fetch(
          process.env.SYSTEM_ALERT_API_URL ||
            'http://localhost:3000/healthz/ready',
          { signal: AbortSignal.timeout(5000), redirect: 'error' },
        );
        apiAvailable = response.ok;
        await response.body?.cancel();
      } catch {
        /* An unreachable API is a monitored condition. */
      }
      const now = Date.now();
      const issues = currentIssues(snapshot, apiAvailable, now);
      const transport = mail ? nodemailer.createTransport(mail.options) : null;
      try {
        await evaluateAndSend({
          settings,
          issues,
          state,
          now,
          persist: (value) => writeJson('delivery.json', value),
          send: async (recipient, kind, body) => {
            await renew();
            if (!transport || !mail) throw new Error('SMTP not configured');
            const result = await transport.sendMail({
              from: mail.from,
              to: recipient,
              subject: `[GAINGE CRM][${kind}] 시스템 알림`,
              text: `${body}\n\n서비스: ${process.env.SERVER_URL || 'GAINGE CRM'}\n관리자 패널 > 시스템 지표에서 확인하세요.`,
              disableFileAccess: true,
              disableUrlAccess: true,
            });
            if (!result.accepted?.length || result.rejected?.length)
              throw new Error('SMTP recipient rejected');
          },
        });
      } finally {
        transport?.close();
      }
      await writeJson('status.json', {
        checkedAt: new Date().toISOString(),
        mailConfigured: Boolean(mail),
        lastSentAt: state.lastSentAt,
        lastError: state.lastError,
        lastTestAt: state.lastTestAt,
        activeIssues: Object.values(state.incidents || {})
          .filter(
            (incident) =>
              incident.bad >= 2 || Object.keys(incident.delivered).length,
          )
          .map((incident) => incident.issue),
      });
    } catch {
      // Keep prior delivery state on I/O errors; never report successful delivery.
      console.error(
        'System alert monitor failed a cycle; check shared storage and mail configuration.',
      );
    }
    for (let elapsed = 0; elapsed < INTERVAL && !stopped; elapsed += 1000)
      await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (ownsLock && (await readJson('owner.json', {}, lock)).owner === owner)
    await fs.rm(lock, { recursive: true, force: true });
}

module.exports = { smtpConfiguration, currentIssues, evaluateAndSend };
if (require.main === module)
  run().catch(() => {
    console.error('Cannot start system alert monitor.');
    process.exitCode = 1;
  });
