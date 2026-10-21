// Run inside the candidate image before any schema or metadata changes.
const { randomUUID } = require('node:crypto');

async function checkRedis(redis) {
  const memory = Object.fromEntries(
    (await redis.info('memory'))
      .split('\r\n')
      .filter((line) => line.includes(':'))
      .map((line) => line.split(':')),
  );
  const used = Number(memory.used_memory);
  const limit = Number(memory.maxmemory);

  if (!Number.isFinite(used) || !Number.isFinite(limit)) {
    throw new Error('Redis memory information is unavailable');
  }
  if (limit > 0 && used / limit >= 0.8) {
    throw new Error('Redis memory is at least 80% of maxmemory; upgrade aborted');
  }

  const key = `deployment:preflight:${randomUUID()}`;
  try {
    await redis.set(key, 'ok', 'EX', 30);
    if ((await redis.get(key)) !== 'ok') {
      throw new Error('Redis write/read probe failed');
    }
  } finally {
    await redis.del(key);
  }
}

async function main() {
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  redis.on('error', () => {});

  try {
    await redis.connect();
    await checkRedis(redis);
    console.log('Redis preflight passed: writable and below 80% maxmemory');
  } finally {
    redis.disconnect();
  }
}

module.exports = { checkRedis };
if (require.main === module || module.id === '[stdin]') {
  main().catch(() => {
    console.error('Redis preflight failed (connectivity, write probe, or memory >= 80%). No migrations started.');
    process.exitCode = 1;
  });
}
