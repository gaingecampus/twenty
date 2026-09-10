import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, cleanName, phone, domain, main } from './detect.ts';
const date='2026-09-08T00:00:00Z';
const c=(id,name,extra={})=>({id,name,...extra});
test('법인 표기는 정리하되 실제 상호의 주 및 지점명은 보존한다',()=>{
  assert.equal(cleanName('(주) 베르데코'),'베르데코');
  assert.equal(cleanName('㈜ 베르데코'),'베르데코');
  assert.equal(cleanName('주식회사 베르데코'),'베르데코');
  assert.equal(cleanName('주사랑'),'주사랑');
  assert.notEqual(cleanName('가인지(서울지점)'),cleanName('가인지(부산지점)'));
});
test('한국 전화번호와 도메인 정규화 및 공용 서비스 제외',()=>{
  assert.equal(phone('+82 2-1234-5678'),phone('02-1234-5678'));
  assert.equal(domain('https://www.example.co.kr/contact'),'example.co.kr');
  assert.equal(domain('instagram.com/acme'),'');
  assert.equal(phone('000-0000-0000'),'');
});
test('빈값과 일반명으로 후보를 만들지 않는다',()=>{
  assert.equal(analyze([c('a',''),c('b',''),c('c','테스트'),c('d','테스트')],date).candidateCount,0);
});
test('이름 단독은 일반 검토, 추가 일치는 우선 검토, 충돌은 별도 분류',()=>{
  assert.equal(analyze([c('a','베르데코'),c('b','(주)베르데코')],date).reviewCount,1);
  const site={domainName:{primaryLinkUrl:'https://example.co.kr'}};
  const strong=analyze([c('a','베르데코',site),c('b','(주)베르데코',site)],date);
  assert.equal(strong.priorityCount,1); assert.equal(strong.mutationCount,0);
  assert.equal(analyze([c('a','베르데코',{...site,driMemberId:'one'}),c('b','베르데코',{...site,driMemberId:'two'})],date).conflictCount,1);
});
test('별칭은 도메인으로 탐지하지만 전이 관계는 확정하지 않는다',()=>{
  const result=analyze([c('a','알파',{domainName:{primaryLinkUrl:'example.com'}}),c('b','알파',{domainName:{primaryLinkUrl:'other.com'}}),c('c','베타',{domainName:{primaryLinkUrl:'other.com'}})],date);
  assert.equal(result.candidateCount,2);
  assert.ok(!result.markdown.includes('a:c'));
});
test('후보 키 안정성, 삭제 레코드 제외, 입력 불변, 중복 ID 감지',()=>{
  const records=[c('b','정상기업'),c('a','정상기업'),c('c','정상기업',{deletedAt:date})];
  const before=JSON.stringify(records);
  const result=analyze(records,date);
  assert.equal(result.candidateCount,1); assert.ok(result.markdown.includes('a:b'));
  assert.equal(result.scannedCount,2); assert.equal(JSON.stringify(records),before);
  assert.throws(()=>analyze([c('a','회사명'),c('a','회사명')],date),/중복 ID/);
});
test('페이지 전체 조회를 검증하고 모든 네트워크 요청은 읽기 쿼리만 사용한다',async()=>{
  const fetchBefore=global.fetch, baseBefore=process.env.TWENTY_API_URL, tokenBefore=process.env.TWENTY_APP_ACCESS_TOKEN;
  process.env.TWENTY_API_URL='https://crm.gainge.com'; process.env.TWENTY_APP_ACCESS_TOKEN='test-only';
  const records=Array.from({length:405},(_,i)=>c(String(i),`기업${i}`));
  let count=records.length; let calls=0;
  global.fetch=async(url,options)=>{
    assert.equal(String(url),'https://crm.gainge.com/graphql');
    const body=JSON.parse(options.body); assert.ok(body.query.trim().startsWith('query '));
    assert.ok(!/mutation|deleteCompanies|mergeCompanies/.test(body.query));
    calls++;
    return {ok:true,json:async()=>({data:{companies:{totalCount:count,edges:records.slice(body.variables.offset,body.variables.offset+body.variables.first).map(node=>({node}))}}})};
  };
  try {
    assert.equal((await main()).scannedCount,405); assert.equal(calls,4);
    count=406; await assert.rejects(main(),/전체 기업 조회/);
  } finally {
    global.fetch=fetchBefore;
    if(baseBefore===undefined)delete process.env.TWENTY_API_URL;else process.env.TWENTY_API_URL=baseBefore;
    if(tokenBefore===undefined)delete process.env.TWENTY_APP_ACCESS_TOKEN;else process.env.TWENTY_APP_ACCESS_TOKEN=tokenBefore;
  }
});
