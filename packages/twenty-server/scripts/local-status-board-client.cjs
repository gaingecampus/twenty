const fs = require('fs'),
  crypto = require('crypto'),
  { Client } = require(process.cwd() + '/node_modules/pg'),
  jwt = require(process.cwd() + '/node_modules/jsonwebtoken');
module.exports = async () => {
  const env = Object.fromEntries(
    fs
      .readFileSync('packages/twenty-server/.env', 'utf8')
      .split('\n')
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => {
        let i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
      }),
  );
  const dbUrl = new URL(env.PG_DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(dbUrl.hostname))
    throw Error('Local database only');
  const c = new Client({ connectionString: env.PG_DATABASE_URL });
  await c.connect();
  const w = (await c.query('select id,"databaseSchema" from core.workspace'))
    .rows;
  if (w.length !== 1) throw Error('Expected one local workspace');
  const workspaceId = w[0].id;
  const uw = (
    await c.query(
      'select id,"userId" from core."userWorkspace" where "workspaceId"=$1 limit 1',
      [workspaceId],
    )
  ).rows[0];
  const wm = (
    await c.query(
      `select id from "${w[0].databaseSchema}"."workspaceMember" where "userId"=$1`,
      [uw.userId],
    )
  ).rows[0];
  const token = jwt.sign(
    {
      sub: uw.userId,
      userId: uw.userId,
      workspaceId,
      userWorkspaceId: uw.id,
      workspaceMemberId: wm.id,
      type: 'ACCESS',
      authProvider: 'password',
    },
    crypto
      .createHash('sha256')
      .update(env.APP_SECRET + workspaceId + 'ACCESS')
      .digest('hex'),
    { expiresIn: '30m' },
  );
  const gql = async (query, variables = {}, path = 'metadata') => {
    const r = await fetch('http://localhost:3000/' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors) throw Error(JSON.stringify(j.errors));
    return j.data;
  };
  return { c, gql, workspaceId, schema: w[0].databaseSchema };
};
if (require.main === module)
  module
    .exports()
    .then(async ({ c, gql }) => {
      try {
        console.log(await gql('{ __typename }'));
      } finally {
        await c.end();
      }
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
