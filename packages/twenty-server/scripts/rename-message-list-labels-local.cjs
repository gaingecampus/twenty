// Run from packages/twenty-server, then run the cache:flush CLI command.
const fs = require('node:fs');
const { Client } = require('pg');
const dotenv = require('dotenv');

async function main() {
  const { PG_DATABASE_URL } = dotenv.parse(fs.readFileSync('.env'));
  if (
    !['localhost', '127.0.0.1', '::1'].includes(
      new URL(PG_DATABASE_URL).hostname,
    )
  ) {
    throw new Error('This script only supports a local database.');
  }
  const client = new Client({ connectionString: PG_DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const table of ['objectMetadata', 'fieldMetadata']) {
      const result = await client.query(
        `UPDATE core."${table}"
         SET "standardOverrides" = replace("standardOverrides"::text, $1, $2)::jsonb
         WHERE "standardOverrides"::text LIKE $3`,
        ['수신자 목록', '동반 고객 목록', '%수신자 목록%'],
      );
      const previousListResult = await client.query(
        `UPDATE core."${table}"
         SET "standardOverrides" = replace("standardOverrides"::text, $1, $2)::jsonb
         WHERE "standardOverrides"::text LIKE $3`,
        ['심방콜 목록', '동반 고객 목록', '%심방콜 목록%'],
      );
      const campaignResult = await client.query(
        `UPDATE core."${table}"
         SET "standardOverrides" = replace("standardOverrides"::text, $1, $2)::jsonb
         WHERE "standardOverrides"::text LIKE $3`,
        ['단체 발송', '심방콜 발송', '%단체 발송%'],
      );
      console.log(
        `${table}: ${result.rowCount + previousListResult.rowCount + campaignResult.rowCount} display overrides updated`,
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
