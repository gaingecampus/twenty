// Read-only operational diagnostic. Never print tokens, credentials, or request objects.
const { GoogleAuth } = require('google-auth-library');
(async () => {
  const credentials = JSON.parse(Buffer.from(process.env.CRM_PUBLIC_WIF_CONFIG, 'base64').toString());
  const client = await new GoogleAuth({credentials, scopes:['https://www.googleapis.com/auth/chat.bot']}).getClient();
  const response = await client.request({url:'https://chat.googleapis.com/v1/spaces/AAQAEZqZkIA', method:'GET', timeout:15000});
  console.log(JSON.stringify({status:'OK', space:response.data.name, displayName:response.data.displayName}));
  const {Client}=require('pg');
  const url=new URL(process.env.PG_DATABASE_URL); url.searchParams.delete('sslmode');
  const db=new Client({connectionString:url.toString(),ssl:process.env.PG_SSL_ALLOW_SELF_SIGNED==='true'?{rejectUnauthorized:false}:undefined});
  await db.connect();
  try {
    const columns=await db.query("SELECT table_name,column_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema=$1 AND table_name IN ('_companyGuseongweonLink','_gyeyagGuseongweonLink') ORDER BY table_name,ordinal_position",['workspace_5htl93s0o5y0srdosknh2lg2l']);
    console.log(JSON.stringify({junctionColumns:columns.rows}));
    const events=await db.query('SELECT "recordId",kind,"enrichmentStatus","chatStatus","enrichmentAttempts","chatAttempts","completedAt" FROM workspace_5htl93s0o5y0srdosknh2lg2l."_gaingeAutomationEvent" WHERE "recordId"=ANY($1::uuid[]) ORDER BY "createdAt"', [['bfe9116e-4b6d-4758-ade3-6d65b7b68c0a','b99f6329-7683-4e11-b377-6a01ba8e83de']]);
    console.log(JSON.stringify({testEvents:events.rows}));
  } finally {await db.end();}
})().catch(error => {
  const payload=error.response?.data;
  console.log(JSON.stringify({status:'FAILED', httpStatus:error.response?.status, code:payload?.error?.status ?? error.code, reason:String(payload?.error?.message ?? payload?.error_description ?? 'Authentication or API request failed').slice(0,500)}));
  process.exitCode=1;
});
