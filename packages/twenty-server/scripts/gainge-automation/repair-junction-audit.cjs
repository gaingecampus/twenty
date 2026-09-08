// Repairs only the four GAINGE trigger functions installed by migration 2.21.
// Business records are not rewritten. The transaction rolls back on unexpected definitions.
const assert=require('node:assert/strict');
const {Client}=require('pg');
(async()=>{
 const url=new URL(process.env.PG_DATABASE_URL); url.searchParams.delete('sslmode');
 const db=new Client({connectionString:url.toString(),ssl:process.env.PG_SSL_ALLOW_SELF_SIGNED==='true'?{rejectUnauthorized:false}:undefined});
 await db.connect();
 try{
  await db.query('BEGIN'); await db.query("SET LOCAL lock_timeout='5s'");
  for(const object of ['company','person','opportunity','onboarding']){
   const functionName='workspace_5htl93s0o5y0srdosknh2lg2l.gainge_record_'+object+'()';
   const definition=(await db.query('SELECT pg_get_functiondef($1::regprocedure) AS source',[functionName])).rows[0].source;
   if(definition.includes('"createdByName","updatedBySource","updatedByName")')){console.log(object+': already repaired');continue;}
   const columns='"guseongweonId","createdBySource","createdByName")';
   const values="SELECT NEW.id,member_ids[1],'SYSTEM','CRM 담당자 자동 배정'";
   assert.equal(definition.split(columns).length,2,'Unexpected junction columns');
   assert.equal(definition.split(values).length,2,'Unexpected junction values');
   const repaired=definition.replace(columns,'"guseongweonId","createdBySource","createdByName","updatedBySource","updatedByName")').replace(values,values+",'SYSTEM','CRM 담당자 자동 배정'");
   await db.query(repaired); console.log(object+': audit columns repaired');
  }
  await db.query('COMMIT');
 }catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}
})().catch(error=>{console.error('Trigger repair failed:',error.code??error.name);process.exitCode=1;});
