// Read-only operational diagnostic. Never print tokens, credentials, or request objects.
const { GoogleAuth } = require('google-auth-library');
(async () => {
  const credentials = JSON.parse(Buffer.from(process.env.CRM_PUBLIC_WIF_CONFIG, 'base64').toString());
  const client = await new GoogleAuth({credentials, scopes:['https://www.googleapis.com/auth/chat.bot']}).getClient();
  const response = await client.request({url:'https://chat.googleapis.com/v1/spaces/AAQAEZqZkIA', method:'GET', timeout:15000});
  console.log(JSON.stringify({status:'OK', space:response.data.name, displayName:response.data.displayName}));
})().catch(error => {
  const payload=error.response?.data;
  console.log(JSON.stringify({status:'FAILED', httpStatus:error.response?.status, code:payload?.error?.status ?? error.code, reason:String(payload?.error?.message ?? payload?.error_description ?? 'Authentication or API request failed').slice(0,500)}));
  process.exitCode=1;
});
