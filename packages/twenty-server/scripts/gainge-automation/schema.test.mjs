import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {buildAutomationSql,buildEnrichmentResumeSql,AUTOMATION_TARGETS} from '../../src/modules/gainge-automation/automation-schema.ts';
test('transactional DRI and durable events across four objects',async()=>{
 const url=new URL(process.env.PG_DATABASE_URL);assert.ok(['localhost','127.0.0.1'].includes(url.hostname));
 const c=new pg.Client({connectionString:url.href});await c.connect();const ns='automation_test_'+Date.now();
 try{await c.query('BEGIN');await c.query(`CREATE SCHEMA "${ns}"`);
 await c.query(`CREATE TABLE "${ns}"."teamMember" (id uuid PRIMARY KEY,"workspaceMemberAccountId" uuid,"deletedAt" timestamptz)`);
 const actor='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222',owner='33333333-3333-4333-8333-333333333333';
 await c.query(`INSERT INTO "${ns}"."teamMember" VALUES($1,$2,NULL)`,[member,actor]);
 for(const t of AUTOMATION_TARGETS){await c.query(`CREATE TABLE "${ns}"."${t.table}" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,"${t.dri}" uuid,"deletedAt" timestamptz,"createdBySource" text,"createdByWorkspaceMemberId" uuid,"createdByName" text,"updatedBySource" text,"updatedByWorkspaceMemberId" uuid,"updatedByName" text,"customStage" text,"onboardingStatus" text)`);await c.query(`CREATE TABLE "${ns}"."${t.link}" (id uuid DEFAULT gen_random_uuid(),"${t.parent}" uuid REFERENCES "${ns}"."${t.table}"(id),"guseongweonId" uuid,"deletedAt" timestamptz,"createdBySource" text,"createdByName" text)`);}
 await c.query(buildAutomationSql(ns,AUTOMATION_TARGETS));await c.query(buildAutomationSql(ns,AUTOMATION_TARGETS));
 for(const t of AUTOMATION_TARGETS){const row=(await c.query(`INSERT INTO "${ns}"."${t.table}"(name,"createdBySource","createdByWorkspaceMemberId") VALUES('test','MANUAL',$1) RETURNING *`,[actor])).rows[0];assert.equal(row[t.dri],member);
 await c.query(`UPDATE "${ns}"."${t.table}" SET "${t.dri}"=$1,"updatedBySource"='MANUAL',"updatedByWorkspaceMemberId"=$2 WHERE id=$3`,[owner,actor,row.id]);
 await c.query(`UPDATE "${ns}"."${t.table}" SET name='repeat' WHERE id=$1`,[row.id]);
 assert.equal((await c.query(`SELECT count(*)::int AS n FROM "${ns}"."${t.link}" WHERE "${t.parent}"=$1`,[row.id])).rows[0].n,1);
 assert.equal((await c.query(`SELECT "${t.dri}" AS id FROM "${ns}"."${t.table}" WHERE id=$1`,[row.id])).rows[0].id,owner);
 const events=()=>c.query(`SELECT count(*)::int n FROM "${ns}"."_gaingeAutomationEvent" WHERE "recordId"=$1`,[row.id]);const n=(await events()).rows[0].n;
 await c.query(`UPDATE "${ns}"."${t.table}" SET name='system',"updatedBySource"='SYSTEM' WHERE id=$1`,[row.id]);assert.equal((await events()).rows[0].n,n);
 await c.query(`UPDATE "${ns}"."${t.table}" SET "deletedAt"=now() WHERE id=$1`,[row.id]);assert.equal((await events()).rows[0].n,n);
 }
 const ambiguous='44444444-4444-4444-8444-444444444444';await c.query(`INSERT INTO "${ns}"."teamMember" VALUES($1,$2,NULL)`,[ambiguous,actor]);
 const row=(await c.query(`INSERT INTO "${ns}".company(name,"createdBySource","createdByWorkspaceMemberId") VALUES('ambiguous','MANUAL',$1) RETURNING *`,[actor])).rows[0];assert.equal(row.driMemberId,null);
 assert.equal((await c.query(`SELECT payload->>'driResult' result FROM "${ns}"."_gaingeAutomationEvent" WHERE "recordId"=$1`,[row.id])).rows[0].result,'ACCOUNT_MAPPING_MISSING_OR_AMBIGUOUS');
 }finally{await c.query('ROLLBACK');await c.end();}
});

test('website entered after creation resumes enrichment once and excludes historical or deleted companies',async()=>{
 const url=new URL(process.env.PG_DATABASE_URL);assert.ok(['localhost','127.0.0.1'].includes(url.hostname));
 const c=new pg.Client({connectionString:url.href});await c.connect();const ns='enrichment_resume_'+Date.now();
 try {
 await c.query('BEGIN');await c.query(`CREATE SCHEMA "${ns}"`);
 await c.query(`CREATE TABLE "${ns}".company(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,"updatedAt" timestamptz,"deletedAt" timestamptz,"aiEnrichmentStatus" text,"aiCompanyProfile" text,"domainNamePrimaryLinkUrl" text,"aiEnrichmentCheckedAt" timestamptz)`);
 await c.query(buildAutomationSql(ns,[]));
 await c.query(`INSERT INTO "${ns}".company(name,"updatedAt","aiEnrichmentCheckedAt","aiEnrichmentStatus","domainNamePrimaryLinkUrl","deletedAt") VALUES('new',now(),now()-interval '1 minute','NEEDS_WEBSITE','https://example.com',NULL),('historical',now(),NULL,NULL,'https://example.com',NULL),('deleted',now(),now()-interval '1 minute','NEEDS_WEBSITE','https://example.com',now())`);
 await c.query(buildEnrichmentResumeSql(ns));await c.query(buildEnrichmentResumeSql(ns));
 const rows=(await c.query(`SELECT * FROM "${ns}"."_gaingeAutomationEvent"`)).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].payload.name,'new');assert.equal(rows[0].chatStatus,'NOT_APPLICABLE');
 await c.query(`UPDATE "${ns}"."_gaingeAutomationEvent" SET "enrichmentStatus"='NEEDS_REVIEW',"completedAt"=now()`);
 await c.query(buildEnrichmentResumeSql(ns));assert.equal((await c.query(`SELECT count(*)::int n FROM "${ns}"."_gaingeAutomationEvent"`)).rows[0].n,1);
 } finally {await c.query('ROLLBACK');await c.end();}
});
