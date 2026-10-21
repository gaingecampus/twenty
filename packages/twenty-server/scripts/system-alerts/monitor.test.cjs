const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  smtpConfiguration,
  currentIssues,
  evaluateAndSend,
} = require('./monitor.cjs');
const now = Date.now();
const issue = { key: 'redis.down', label: 'Redis', detail: '연결 실패' };
const settings = {
  enabled: true,
  recipients: ['first@example.com', 'second@example.com'],
};
const persist = async () => {};

test('requires real SMTP configuration and TLS', () => {
  assert.equal(smtpConfiguration({ EMAIL_DRIVER: 'LOGGER' }), null);
  const mail = smtpConfiguration({
    SYSTEM_ALERT_SMTP_HOST: 'smtp.example.com',
    SYSTEM_ALERT_FROM_ADDRESS: 'alerts@example.com',
  });
  assert.equal(mail.options.requireTLS, true);
  assert.equal(
    smtpConfiguration({
      EMAIL_SMTP_HOST: 'smtp',
      EMAIL_FROM_ADDRESS: 'bad\nheader',
    }),
    null,
  );
});
test('detects API failure and stale or future measurements', () => {
  assert.equal(currentIssues(null, false, now).length, 2);
  assert.equal(
    currentIssues(
      { checkedAt: new Date(now).toISOString(), issues: [issue] },
      true,
      now,
    )[0].key,
    issue.key,
  );
  assert.equal(
    currentIssues(
      { checkedAt: new Date(now + 1000).toISOString(), issues: [] },
      true,
      now,
    )[0].key,
    'monitor.stale',
  );
});
test('two consecutive failures, one email per recipient, restart-safe dedup, two successful recoveries', async () => {
  let state = {};
  const sent = [];
  const send = async (...args) => {
    sent.push(args);
  };
  const tick = async (issues) => {
    state = await evaluateAndSend({
      settings,
      issues,
      state: JSON.parse(JSON.stringify(state)),
      now,
      send,
      persist,
    });
  };
  await tick([issue]);
  assert.equal(sent.length, 0);
  await tick([issue]);
  assert.equal(sent.length, 2);
  await tick([issue]);
  assert.equal(sent.length, 2);
  await tick([]);
  assert.equal(sent.length, 2);
  await tick([]);
  assert.equal(sent.length, 4);
  assert.equal(sent[2][1], '복구');
  await tick([]);
  assert.equal(sent.length, 4);
});
test('retries failed recipients without resending to successful recipients', async () => {
  const state = {};
  const sent = [];
  let fail = true;
  const send = async (recipient) => {
    if (recipient === settings.recipients[1] && fail) throw Error('SMTP');
    sent.push(recipient);
  };
  const tick = () =>
    evaluateAndSend({ settings, issues: [issue], state, now, send, persist });
  await tick();
  await tick();
  assert.equal(sent.length, 1);
  assert.ok(state.lastError);
  fail = false;
  await tick();
  assert.deepEqual(sent, settings.recipients);
  assert.equal(state.lastError, undefined);
});
test('disabled alerts do not send; explicit test sends once even when disabled', async () => {
  const state = {};
  const sent = [];
  const configuration = {
    ...settings,
    enabled: false,
    testRequest: { id: 'test', createdAt: new Date(now).toISOString() },
  };
  const tick = () =>
    evaluateAndSend({
      settings: configuration,
      issues: [issue],
      state,
      now,
      send: async (...args) => sent.push(args),
      persist,
    });
  await tick();
  await tick();
  assert.equal(sent.length, 2);
  assert.equal(sent[0][1], '테스트');
  assert.ok(state.lastTestAt);
  configuration.recipients = ['new@example.com'];
  await tick();
  assert.equal(sent.length, 2);
});
test('missing metrics do not produce false recovery emails', async () => {
  const state = {};
  const sent = [];
  const tick = (issues) =>
    evaluateAndSend({
      settings,
      issues,
      state,
      now,
      send: async (...args) => sent.push(args),
      persist,
    });
  await tick([issue]);
  await tick([issue]);
  const stale = { key: 'monitor.stale', label: 'stale', detail: 'stale' };
  await tick([stale]);
  await tick([stale]);
  assert.ok(state.incidents['redis.down']);
  assert.equal(
    sent.some((item) => item[1] === '복구'),
    false,
  );
});
test('removed recipients get no recovery and new recipients get ongoing incident', async () => {
  const state = {};
  const sent = [];
  const tick = (config) =>
    evaluateAndSend({
      settings: config,
      issues: [issue],
      state,
      now,
      send: async (recipient) => sent.push(recipient),
      persist,
    });
  await tick(settings);
  await tick(settings);
  await tick({ enabled: true, recipients: ['new@example.com'] });
  assert.deepEqual(sent, [...settings.recipients, 'new@example.com']);
});
test('server storage monitoring failure does not recover a disk capacity incident', async () => {
  const state = {};
  const sent = [];
  const tick = (issues) =>
    evaluateAndSend({
      settings,
      issues,
      state,
      now,
      send: async (...args) => sent.push(args),
      persist,
    });
  const disk = { key: 'app.storage', label: 'disk', detail: 'low space' };
  await tick([disk]);
  await tick([disk]);
  const unavailable = {
    key: 'app.storage-monitor',
    label: 'disk monitor',
    detail: 'unavailable',
  };
  await tick([unavailable]);
  await tick([unavailable]);
  assert.ok(state.incidents['app.storage']);
  assert.equal(
    sent.some((item) => item[1] === '복구'),
    false,
  );
  await tick([]);
  await tick([]);
  assert.equal(sent.filter((item) => item[1] === '복구').length, 2);
});

test('unknown measurements interrupt consecutive failure and recovery counts', async () => {
  const state = {};
  const sent = [];
  const tick = (issues) =>
    evaluateAndSend({
      settings,
      issues,
      state,
      now,
      send: async (...args) => sent.push(args),
      persist,
    });
  const stale = { key: 'monitor.stale', label: 'stale', detail: 'stale' };
  await tick([issue]);
  await tick([stale]);
  await tick([issue]);
  assert.equal(sent.length, 0);
  await tick([issue]);
  assert.equal(sent.length, 2);
  await tick([]);
  await tick([stale]);
  await tick([]);
  assert.equal(sent.length, 2);
  await tick([]);
  assert.equal(sent.filter((item) => item[1] === '복구').length, 2);
});
