import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {buildAutomationSql,buildEnrichmentResumeSql,buildAutomatedCollaboratorCleanupSql,AUTOMATED_COLLABORATOR_NAME,AUTOMATION_TARGETS} from '../../src/modules/gainge-automation/automation-schema.ts';
test('transactional DRI and durable events across four objects',async()=>{
 const url=new URL(process.env.PG_DATABASE_URL);assert.ok(['localhost','127.0.0.1'].includes(url.hostname));
 const c=new pg.Client({connectionString:url.href});await c.connect();const ns='automation_test_'+Date.now(); const tables=Object.fromEntries(AUTOMATION_TARGETS.flatMap(t=>[[t.table,t.table==='onboarding'?'_onboarding':t.table],[t.link,'_'+t.link]]));tables.teamMember='_teamMember';
 try{await c.query('BEGIN');await c.query(`CREATE SCHEMA "${ns}"`);
 await c.query(`CREATE TABLE "${ns}"."${tables.teamMember}" (id uuid PRIMARY KEY,"workspaceMemberAccountId" uuid,"deletedAt" timestamptz)`);
 const actor='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222',owner='33333333-3333-4333-8333-333333333333';
 await c.query(`INSERT INTO "${ns}"."${tables.teamMember}" VALUES($1,$2,NULL)`,[member,actor]);
 for(const t of AUTOMATION_TARGETS){await c.query(`CREATE TABLE "${ns}"."${tables[t.table]}" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,"${t.dri}" uuid,"deletedAt" timestamptz,"createdBySource" text,"createdByWorkspaceMemberId" uuid,"createdByName" text,"updatedBySource" text,"updatedByWorkspaceMemberId" uuid,"updatedByName" text,"customStage" text,"onboardingStatus" text)`);await c.query(`CREATE TABLE "${ns}"."${tables[t.link]}" (id uuid DEFAULT gen_random_uuid(),"${t.parent}" uuid REFERENCES "${ns}"."${tables[t.table]}"(id),"guseongweonId" uuid,"deletedAt" timestamptz,"createdBySource" text NOT NULL,"createdByName" text NOT NULL,"updatedBySource" text NOT NULL,"updatedByName" text NOT NULL)`);}
 await c.query(buildAutomationSql(ns,AUTOMATION_TARGETS,tables));await c.query(buildAutomationSql(ns,AUTOMATION_TARGETS,tables));
 for(const t of AUTOMATION_TARGETS){const row=(await c.query(`INSERT INTO "${ns}"."${tables[t.table]}"(name,"createdBySource","createdByWorkspaceMemberId") VALUES('test','MANUAL',$1) RETURNING *`,[actor])).rows[0];assert.equal(row[t.dri],member);
 await c.query(`UPDATE "${ns}"."${tables[t.table]}" SET "${t.dri}"=$1,"updatedBySource"='MANUAL',"updatedByWorkspaceMemberId"=$2 WHERE id=$3`,[owner,actor,row.id]);
 await c.query(`UPDATE "${ns}"."${tables[t.table]}" SET name='repeat' WHERE id=$1`,[row.id]);
 assert.equal((await c.query(`SELECT count(*)::int AS n FROM "${ns}"."${tables[t.link]}" WHERE "${t.parent}"=$1`,[row.id])).rows[0].n,t.addsEditorAsCollaborator?1:0);
 assert.equal((await c.query(`SELECT "${t.dri}" AS id FROM "${ns}"."${tables[t.table]}" WHERE id=$1`,[row.id])).rows[0].id,owner);
 assert.equal((await c.query(`SELECT \"objectName\" FROM \"${ns}\".\"_gaingeAutomationEvent\" WHERE \"recordId\"=$1 LIMIT 1`,[row.id])).rows[0].objectName,t.table);
 const events=()=>c.query(`SELECT count(*)::int n FROM "${ns}"."_gaingeAutomationEvent" WHERE "recordId"=$1`,[row.id]);const n=(await events()).rows[0].n;
 await c.query(`UPDATE "${ns}"."${tables[t.table]}" SET name='system',"updatedBySource"='SYSTEM' WHERE id=$1`,[row.id]);assert.equal((await events()).rows[0].n,n);
 await c.query(`UPDATE "${ns}"."${tables[t.table]}" SET "deletedAt"=now() WHERE id=$1`,[row.id]);assert.equal((await events()).rows[0].n,n);
 }
 const ambiguous='44444444-4444-4444-8444-444444444444';await c.query(`INSERT INTO "${ns}"."${tables.teamMember}" VALUES($1,$2,NULL)`,[ambiguous,actor]);
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

test('reinstalling contract triggers stops adding the editor as a co-consultant on existing installs',async()=>{
 const url=new URL(process.env.PG_DATABASE_URL);assert.ok(['localhost','127.0.0.1'].includes(url.hostname));
 const c=new pg.Client({connectionString:url.href});await c.connect();const ns='automation_upgrade_'+Date.now();
 const tables=Object.fromEntries(AUTOMATION_TARGETS.flatMap(t=>[[t.table,t.table==='onboarding'?'_onboarding':t.table],[t.link,'_'+t.link]]));tables.teamMember='_teamMember';
 const legacyTargets=AUTOMATION_TARGETS.map(t=>({...t,addsEditorAsCollaborator:true}));
 try{await c.query('BEGIN');await c.query(`CREATE SCHEMA "${ns}"`);
 await c.query(`CREATE TABLE "${ns}"."${tables.teamMember}" (id uuid PRIMARY KEY,"workspaceMemberAccountId" uuid,"deletedAt" timestamptz)`);
 const actor='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222',owner='33333333-3333-4333-8333-333333333333';
 await c.query(`INSERT INTO "${ns}"."${tables.teamMember}" VALUES($1,$2,NULL)`,[member,actor]);
 for(const t of AUTOMATION_TARGETS){await c.query(`CREATE TABLE "${ns}"."${tables[t.table]}" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,"${t.dri}" uuid,"deletedAt" timestamptz,"createdBySource" text,"createdByWorkspaceMemberId" uuid,"createdByName" text,"updatedBySource" text,"updatedByWorkspaceMemberId" uuid,"updatedByName" text,"customStage" text,"onboardingStatus" text)`);await c.query(`CREATE TABLE "${ns}"."${tables[t.link]}" (id uuid DEFAULT gen_random_uuid(),"${t.parent}" uuid REFERENCES "${ns}"."${tables[t.table]}"(id),"guseongweonId" uuid,"deletedAt" timestamptz,"createdBySource" text NOT NULL,"createdByName" text NOT NULL,"updatedBySource" text NOT NULL,"updatedByName" text NOT NULL)`);}
 await c.query(buildAutomationSql(ns,legacyTargets,tables));
 await c.query(buildAutomationSql(ns,AUTOMATION_TARGETS.filter(t=>t.table==='onboarding'),tables));
 const links={};
 for(const t of AUTOMATION_TARGETS){const row=(await c.query(`INSERT INTO "${ns}"."${tables[t.table]}"(name,"${t.dri}","createdBySource") VALUES('test',$1,'API') RETURNING *`,[owner])).rows[0];
 await c.query(`UPDATE "${ns}"."${tables[t.table]}" SET name='edited',"updatedBySource"='MANUAL',"updatedByWorkspaceMemberId"=$1 WHERE id=$2`,[actor,row.id]);
 links[t.table]=(await c.query(`SELECT count(*)::int n FROM "${ns}"."${tables[t.link]}" WHERE "${t.parent}"=$1`,[row.id])).rows[0].n;}
 assert.deepEqual(links,{company:1,person:1,opportunity:1,onboarding:0});
 const empty=(await c.query(`INSERT INTO "${ns}"."${tables.onboarding}"(name,"createdBySource","createdByWorkspaceMemberId") VALUES('empty','MANUAL',$1) RETURNING *`,[actor])).rows[0];
 assert.equal(empty.executionConsultantId,member);
 const link=tables.gyeyagGuseongweonLink,parent=(await c.query(`SELECT id FROM "${ns}"."${tables.onboarding}" LIMIT 1`)).rows[0].id;
 await c.query(`INSERT INTO "${ns}"."${link}"("gyeyagId","guseongweonId","createdBySource","createdByName","updatedBySource","updatedByName") VALUES($1,$2,'SYSTEM',$3,'SYSTEM',$3),($1,$4,'MANUAL','사람','MANUAL','사람'),($1,$2,'SYSTEM','다른 시스템','SYSTEM','다른 시스템')`,[parent,member,AUTOMATED_COLLABORATOR_NAME,owner]);
 const cleanup=await c.query(buildAutomatedCollaboratorCleanupSql(ns,link),[AUTOMATED_COLLABORATOR_NAME]);assert.equal(cleanup.rowCount,1);
 assert.deepEqual((await c.query(`SELECT "createdByName" n FROM "${ns}"."${link}" WHERE "deletedAt" IS NULL`)).rows.map(r=>r.n).sort(),['다른 시스템','사람'].sort());
 assert.equal((await c.query(buildAutomatedCollaboratorCleanupSql(ns,link),[AUTOMATED_COLLABORATOR_NAME])).rowCount,0);
 }finally{await c.query('ROLLBACK');await c.end();}
});
