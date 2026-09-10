// Deployed as a CRM CODE step. Reads companies only; never merges or deletes.
type Company = {
  id: string; name?: string; createdAt?: string; updatedAt?: string;
  deletedAt?: string | null;
  domainName?: { primaryLinkUrl?: string };
  phone?: { primaryPhoneNumber?: string; primaryPhoneCallingCode?: string };
  email?: string; address?: { addressStreet1?: string; addressCity?: string };
  driMemberId?: string | null; accountOwnerId?: string | null;
};
const VERSION = 'candidate-only-v1';
const text = (value: unknown) => String(value ?? '').normalize('NFKC').trim().toLowerCase();
export const exactName = (value: unknown) => text(value).replace(/\s+/g, '');
export const cleanName = (value: unknown) => exactName(value)
  .replace(/\((?:주|유|사|재)\)|주식회사|유한회사|유한책임회사|사단법인|재단법인/g, '');
const sharedHosts = new Set(['naver.com','gmail.com','daum.net','hanmail.net','outlook.com','hotmail.com','yahoo.com','icloud.com','kakao.com','instagram.com','facebook.com','youtube.com','youtu.be','linkedin.com','linktr.ee','notion.so','notion.site','app.notion.com','blog.naver.com','smartstore.naver.com','cafe.naver.com','pf.kakao.com','google.com','sites.google.com']);
export const domain = (value: unknown) => {
  const raw = text(value);
  if (!raw) return '';
  try {
    const url = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, '').replace(/\.$/, '');
    if (!host.includes('.') || url.username || url.password || sharedHosts.has(host)) return '';
    return host;
  } catch { return ''; }
};
export const phone = (value: unknown) => {
  let number = text(value).replace(/\D/g, '');
  if (number.startsWith('0082')) number = '0' + number.slice(4);
  else if (number.startsWith('82')) number = '0' + number.slice(2);
  return number.length >= 8 && number.length <= 15 && !/^(\d)\1+$/.test(number) ? number : '';
};
const validName = (name: string) => name.length >= 2 && !/^(?:없음|미정|테스트|test|unknown|null|none|기업|회사|카페|개인|-)$/i.test(name);
const escape = (value: unknown) => String(value ?? '').replace(/[\r\n|]/g, ' ').replace(/[\[\]<>`*_\\]/g, '');

export const analyze = (records: Company[], startedAt: string) => {
  const active = records.filter(record => !record.deletedAt);
  if (new Set(active.map(record => record.id)).size !== active.length) throw new Error('중복 ID가 포함된 불완전한 조회입니다. 다시 실행하세요.');
  const normalized = active.map(record => ({
    record, exact: exactName(record.name), clean: cleanName(record.name),
    domain: domain(record.domainName?.primaryLinkUrl), phone: phone(record.phone?.primaryPhoneNumber),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(record.email)) ? text(record.email) : '',
  }));
  const pairs = new Map<string, { left: number; right: number; reasons: Set<string> }>();
  const labels = { exact: '기업명 일치(공백·대소문자 정리)', clean: '법인 표기 정리 후 기업명 일치', domain: '기업 도메인 일치', phone: '전화번호 일치', email: '이메일 일치' };
  for (const key of ['exact','clean','domain','phone','email'] as const) {
    const buckets = new Map<string, number[]>();
    normalized.forEach((item, index) => {
      const value = item[key];
      if (!value || ((key === 'exact' || key === 'clean') && !validName(value))) return;
      const indices = buckets.get(value) ?? [];
      indices.push(index); buckets.set(value, indices);
    });
    for (const indices of buckets.values()) for (let a=0; a<indices.length; a++) for (let b=a+1; b<indices.length; b++) {
      const left=indices[a], right=indices[b];
      const pairKey=[normalized[left].record.id, normalized[right].record.id].sort().join(':');
      const pair=pairs.get(pairKey) ?? {left,right,reasons:new Set<string>()};
      // Exact-name evidence is not counted twice as a separate cleaned-name signal.
      if (key !== 'clean' || normalized[left].exact !== normalized[right].exact) pair.reasons.add(labels[key]);
      pairs.set(pairKey,pair);
      if (pairs.size > 10000) throw new Error('후보가 10,000쌍을 넘었습니다. 일반명/공용 연락처를 점검하세요. 결과를 잘라서 성공 처리하지 않습니다.');
    }
  }
  const candidates=[...pairs.entries()].map(([pairKey,pair]) => {
    const a=normalized[pair.left], b=normalized[pair.right];
    const conflicts: string[]=[];
    for (const [key,label] of [['domain','도메인'],['phone','전화번호'],['email','이메일']] as const) {
      if (a[key] && b[key] && a[key] !== b[key]) conflicts.push(`${label} 다름`);
    }
    for (const [key,label] of [['driMemberId','DRI'],['accountOwnerId','고객 책임자']] as const) {
      if (a.record[key] && b.record[key] && a.record[key] !== b.record[key]) conflicts.push(`${label} 다름`);
    }
    const addressA=exactName(a.record.address?.addressStreet1), addressB=exactName(b.record.address?.addressStreet1);
    if (addressA && addressB && addressA !== addressB) conflicts.push('주소 다름');
    const nameMatch=(validName(a.exact) && a.exact===b.exact) || (validName(a.clean) && a.clean===b.clean);
    const corroboration=Boolean((a.domain && a.domain===b.domain) || (a.phone && a.phone===b.phone) || (a.email && a.email===b.email));
    const priority=conflicts.length ? '충돌 검토' : nameMatch && corroboration ? '우선 검토' : '일반 검토';
    return { pairKey, a:a.record, b:b.record, reasons:[...pair.reasons], conflicts, priority };
  }).sort((a,b) => ({'우선 검토':0,'충돌 검토':1,'일반 검토':2}[a.priority]! - {'우선 검토':0,'충돌 검토':1,'일반 검토':2}[b.priority]!) || a.pairKey.localeCompare(b.pairKey));
  const counts={priority:0,conflict:0,review:0};
  candidates.forEach(c => { if(c.priority==='우선 검토') counts.priority++; else if(c.priority==='충돌 검토') counts.conflict++; else counts.review++; });
  const date = new Date(new Date(startedAt).getTime()+9*60*60*1000).toISOString().slice(0,10);
  const lines=[
    `# 기업 중복 후보 탐지 · ${date}`,
    `실행 시작: ${startedAt} / 규칙: ${VERSION}`,
    `검토 기업 ${active.length}개 · 후보 ${candidates.length}쌍 · 후보 기업 ${new Set(candidates.flatMap(c=>[c.a.id,c.b.id])).size}개`,
    `우선 검토 ${counts.priority}쌍 / 충돌 검토 ${counts.conflict}쌍 / 일반 검토 ${counts.review}쌍`,
    '', '이 보고서는 후보 탐지 결과입니다. 기업·고객·문의·계약·노트 연결의 수정, 병합, 삭제를 수행하지 않았습니다.',
    '후속 병합은 별도 검토 후 관계를 보존하고 소프트 삭제하는 방식으로 구현합니다. 현재 자동 병합은 없습니다.',
    '각 행은 직접 일치 근거가 있는 두 기업입니다. A-B와 B-C가 발견되어도 A-B-C 전체를 동일 기업으로 확정하지 않습니다.',
    '우선 검토도 확정 중복이 아닙니다. 담당자/주소 차이는 정상일 수 있으며, 계열사·지점·사업자번호와 연결 이력을 확인해야 합니다.',
    '기본 탐지: 기업명/법인 표기, 대표 도메인, 대표 전화번호, 기업 이메일. 영문 별칭·오타 유사도·보조 연락처는 아직 비교하지 않습니다.',
    '공용 서비스 도메인과 일반명/빈값은 해당 신호에서 제외합니다. 기업명이 없는 기업도 연락처 근거로 비교합니다.',
    '조회는 단일 DB 스냅샷이 아닙니다. 페이지 개수·고유 ID·조회 전후 총건수를 검증하며, 검토 시 최신 레코드를 다시 확인해야 합니다.',
    '', '| 분류 | 기업 A | 기업 B | 일치 근거 | 충돌 | 후보 키 |', '|---|---|---|---|---|---|',
    ...candidates.map(c=>`| ${c.priority} | [${escape(c.a.name)||'(이름 없음)'}](https://crm.gainge.com/object/company/${c.a.id}) | [${escape(c.b.name)||'(이름 없음)'}](https://crm.gainge.com/object/company/${c.b.id}) | ${c.reasons.join(', ')} | ${c.conflicts.join(', ')||'확인된 충돌 없음'} | ${c.pairKey} |`),
  ];
  return { title:`[중복 후보 탐지] ${date} · ${candidates.length}쌍`, markdown:lines.join('\n'), scannedCount:active.length, candidateCount:candidates.length, priorityCount:counts.priority, conflictCount:counts.conflict, reviewCount:counts.review, ruleVersion:VERSION, mutationCount:0 };
};

export const main = async () => {
  const startedAt=new Date().toISOString();
  const base=process.env.TWENTY_API_URL;
  const token=process.env.TWENTY_APP_ACCESS_TOKEN || process.env.TWENTY_API_KEY;
  if (!base || !token) throw new Error('CRM 실행 환경의 API URL 또는 앱 인증이 없습니다.');
  const url=new URL('/graphql',base);
  if (url.origin !== 'https://crm.gainge.com') throw new Error('승인된 CRM 주소와 실행 환경 주소가 다릅니다.');
  const query=`query CompanyDuplicateScan($offset:Int!,$first:Int!) {
    companies(first:$first,offset:$offset,orderBy:[{id:AscNullsFirst}],filter:{deletedAt:{is:NULL}}) {
      totalCount edges { node { id name createdAt updatedAt deletedAt
        domainName { primaryLinkUrl } phone { primaryPhoneNumber primaryPhoneCallingCode }
        email address { addressStreet1 addressCity } driMemberId accountOwnerId
      } }
    }
  }`;
  const page=async (offset:number,first=200) => {
    const response=await fetch(url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({query,variables:{offset,first}}),signal:AbortSignal.timeout(20000)});
    if(!response.ok) throw new Error(`기업 조회 실패: HTTP ${response.status}`);
    const body=await response.json();
    if(body.errors?.length || !body.data?.companies) throw new Error(`기업 조회 실패: ${body.errors?.map((e:{message:string})=>e.message).join('; ')||'응답 없음'}`);
    const result=body.data.companies;
    return { count:Number(result.totalCount), records:result.edges.map((edge:{node:Company})=>edge.node) as Company[] };
  };
  const first=await page(0);
  if(!Number.isInteger(first.count) || first.count<0 || first.count>50000) throw new Error('전체 기업 건수가 없거나 50,000개 상한을 초과했습니다.');
  const records=[...first.records];
  const offsets=Array.from({length:Math.max(0,Math.ceil(first.count/200)-1)},(_,i)=>(i+1)*200);
  for(let i=0;i<offsets.length;i+=4) {
    const pages=await Promise.all(offsets.slice(i,i+4).map(offset=>page(offset)));
    for(const result of pages) {
      if(result.count!==first.count) throw new Error('조회 중 기업 건수가 변경되었습니다. 다시 실행하세요.');
      records.push(...result.records);
    }
  }
  const final=await page(0,1);
  if(final.count!==first.count || records.length!==first.count) throw new Error('전체 기업 조회가 완료되지 않았습니다. 다시 실행하세요.');
  return analyze(records,startedAt);
};
