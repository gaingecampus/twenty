// Run after nest build: validates the compiled runtime that ships to production.
require('reflect-metadata');
const test=require('node:test'), assert=require('node:assert/strict');
const {OAuth2Client}=require('google-auth-library');
const {GaingeChatAuthGuard}=require('../../dist/modules/gainge-automation/google-chat-auth.guard');
const {GaingeAutomationService}=require('../../dist/modules/gainge-automation/gainge-automation.service');
test('Google Chat rejects unsigned and wrong-project identities',async()=>{
 const guard=new GaingeChatAuthGuard({get:()=> 'expected@example.iam.gserviceaccount.com'});
 const context=header=>({switchToHttp:()=>({getRequest:()=>({headers:{authorization:header}})})});
 await assert.rejects(()=>guard.canActivate(context()),e=>e.getStatus()===401);
 const original=OAuth2Client.prototype.verifyIdToken;
 try{OAuth2Client.prototype.verifyIdToken=async options=>{assert.equal(options.audience,'https://crm.gainge.com/gainge-automation/chat');return{getPayload:()=>({email_verified:true,email:'wrong@example.com'})}};
 await assert.rejects(()=>guard.canActivate(context('Bearer fake')),e=>e.getStatus()===401);
 OAuth2Client.prototype.verifyIdToken=async()=>({getPayload:()=>({email_verified:true,email:'expected@example.iam.gserviceaccount.com'})});assert.equal(await guard.canActivate(context('Bearer fake')),true);
 }finally{OAuth2Client.prototype.verifyIdToken=original;}
});
test('notification retries preserve per-destination idempotency and respect personal opt-out',async()=>{
 const sent=[];const queries=[];const config={get:k=>k==='GAINGE_CHAT_SPACE'?'spaces/test':undefined};
 const orm={getGlobalWorkspaceDataSource:async()=>({query:async(sql,args,runner,options)=>{assert.equal(options?.shouldBypassPermissionChecks,true);queries.push({sql,args});return sql.startsWith('SELECT id FROM')?[{id:'active'}]:sql.includes('SELECT "googleChatUserId"')?[{googleChatUserId:'123',googleChatNotificationsEnabled:false}]:[]}})};
 const chat={isEnabled:()=>true,findDirectMessage:async()=>{throw Error('Opt-out must not look up DM')},send:async(...args)=>sent.push(args)};
 const service=new GaingeAutomationService(config,orm,{}, {},chat,{quoted:async(_w,n)=>`"${n}"`});
 const e={id:'11111111-1111-4111-8111-111111111111',recordId:'22222222-2222-4222-8222-222222222222',objectName:'company',kind:'CREATED',payload:{name:'<users/all> test',driId:'33333333-3333-4333-8333-333333333333'},sentDestinations:[],leaseId:'lease'};
 assert.equal(await service.notify('"test"',e),'SENT');assert.equal(sent.length,1);assert.ok(!sent[0][2].includes('<users/all>'));assert.match(sent[0][1],/^[0-9a-f-]{36}$/);
 await service.notify('"test"',e);assert.equal(sent.length,1);
 const retry={...e,sentDestinations:[]};await service.notify('"test"',retry);assert.equal(sent[1][1],sent[0][1]);
});

test('soft-deleted records do not send queued notifications',async()=>{
 const service=new GaingeAutomationService({get:()=>"workspace"}, {getGlobalWorkspaceDataSource:async()=>({query:async()=>[]})},{},{},{isEnabled:()=>true,send:async()=>{throw Error('Deleted record must not notify')}},{quoted:async(_w,n)=>`"${n}"`});
 assert.equal(await service.notify('"test"',{objectName:'company',recordId:'deleted'}),'DELETED');
});

// Exercise the actual datasource implementation: its default query path rejects system SQL.
test('automation uses the explicit internal SQL permission path',async()=>{
 const {DataSource}=require('typeorm');
 const {GlobalWorkspaceDataSource}=require('../../dist/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource');
 const {queryAutomationDatabase}=require('../../dist/modules/gainge-automation/automation-query');
 const original=DataSource.prototype.query;
 try{
  DataSource.prototype.query=async(sql,args)=>{assert.equal(sql,'SELECT $1');assert.deepEqual(args,[42]);return [{value:42}]};
  const ds=Object.create(GlobalWorkspaceDataSource.prototype);
  assert.throws(()=>ds.query('SELECT $1',[42]),/permissions are not implemented/);
  assert.deepEqual(await queryAutomationDatabase(ds,'SELECT $1',[42]),[{value:42}]);
  DataSource.prototype.query=async()=>[[{id:'claimed-event'}],1];
  assert.deepEqual(await queryAutomationDatabase(ds,'UPDATE event RETURNING *'),[{id:'claimed-event'}]);
  DataSource.prototype.query=async()=>[[],0];
  assert.deepEqual(await queryAutomationDatabase(ds,'UPDATE event RETURNING *'),[]);
 }finally{DataSource.prototype.query=original;}
});
