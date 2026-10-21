const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkRedis } = require('./check-deployment-dependencies.cjs');

function redis(used, limit) {
  const calls = [];
  return {
    calls,
    info: async () => `used_memory:${used}\r\nmaxmemory:${limit}\r\n`,
    set: async (...args) => calls.push(args),
    get: async () => 'ok',
    del: async (key) => calls.push(['del', key]),
  };
}

test('blocks at the memory threshold before a write or migration', async () => {
  const client = redis(800, 1000);
  await assert.rejects(checkRedis(client), /80%/);
  assert.equal(client.calls.length, 0);
});

test('allows healthy memory and cleans only its own expiring probe', async () => {
  const client = redis(100, 1000);
  await checkRedis(client);
  assert.match(client.calls[0][0], /^deployment:preflight:/);
  assert.deepEqual(client.calls[0].slice(1), ['ok', 'EX', 30]);
  assert.deepEqual(client.calls[1], ['del', client.calls[0][0]]);
});

test('allows unlimited Redis but still verifies writes', async () => {
  const client = redis(100, 0);
  client.set = async () => { throw new Error('OOM'); };
  await assert.rejects(checkRedis(client), /OOM/);
});

test('blocks missing memory information and broken reads', async () => {
  const missing = redis('missing', 'missing');
  await assert.rejects(checkRedis(missing), /unavailable/);
  const client = redis(100, 1000);
  client.get = async () => null;
  await assert.rejects(checkRedis(client), /probe failed/);
});
