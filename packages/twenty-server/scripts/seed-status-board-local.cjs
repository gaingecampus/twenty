// Run from repository root: node packages/twenty-server/scripts/seed-status-board-local.cjs
// Local-only, additive fixtures. Stable IDs make repeated runs update only this dataset.
const connect = require('./local-status-board-client.cjs');
const crypto = require('crypto');
const id = (key) => {
  const h = crypto
    .createHash('sha256')
    .update('gainge-status-board-local-v1:' + key)
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
(async () => {
  const { c, gql, workspaceId, schema } = await connect();
  try {
    const objects = {};
    for (const r of (
      await c.query(
        'select id,"nameSingular" from core."objectMetadata" where "workspaceId"=$1 and "isActive"=true',
        [workspaceId],
      )
    ).rows)
      objects[r.nameSingular] = r.id;
    if (!objects.teamMember) {
      const data = await gql(
        'mutation($input:CreateOneObjectInput!){createOneObject(input:$input){id}}',
        {
          input: {
            object: {
              nameSingular: 'teamMember',
              namePlural: 'teamMembers',
              labelSingular: '구성원 (운영형 더미)',
              labelPlural: '구성원 (운영형 더미)',
              icon: 'IconUsers',
              description: '로컬 현황판 운영 구조 검증용',
            },
          },
        },
      );
      objects.teamMember = data.createOneObject.id;
      console.log('Created local teamMember object');
    }
    const field = async (object, name, label, type, extra = {}) => {
      if (
        (
          await c.query(
            'select id from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2 and "isActive"=true',
            [objects[object], name],
          )
        ).rowCount
      )
        return;
      await gql(
        'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
        {
          input: {
            field: {
              objectMetadataId: objects[object],
              name,
              label,
              type,
              isNullable: true,
              icon: 'IconList',
              ...extra,
            },
          },
        },
      );
      console.log('Added', object + '.' + name);
    };
    const relation = (o, n, l, target, inverse) =>
      field(o, n, l, 'RELATION', {
        relationCreationPayload: {
          type: 'MANY_TO_ONE',
          targetObjectMetadataId: objects[target],
          targetFieldLabel: inverse,
          targetFieldIcon: 'IconList',
        },
      });
    await relation(
      'teamMember',
      'currentGroup',
      '현재 소속 그룹',
      'group',
      '운영형 더미 구성원',
    );
    await field('teamMember', 'employmentStatus', '재직 여부', 'SELECT', {
      options: ['ACTIVE', 'INACTIVE'].map((value, position) => ({
        id: id('employment-' + value),
        value,
        label: position ? '퇴사' : '재직',
        color: position ? 'gray' : 'green',
        position,
      })),
    });
    await relation(
      'opportunity',
      'assignee',
      '담당 구성원',
      'teamMember',
      '담당 문의',
    );
    await field(
      'onboarding',
      'leadConsultantId',
      '리드 담당자 ID (더미 연결)',
      'UUID',
    );
    await field(
      'onboarding',
      'executionConsultantId',
      '실행 담당자 ID (더미 연결)',
      'UUID',
    );
    await relation(
      'onboarding',
      'company',
      '기업',
      'company',
      '운영형 더미 계약',
    );
    await relation(
      'deposit',
      'creator',
      '담당 구성원',
      'teamMember',
      '담당 입금',
    );
    await relation(
      'deposit',
      'revenueDept',
      '매출 귀속 그룹',
      'group',
      '운영형 더미 입금',
    );
    await relation('deposit', 'company', '기업', 'company', '운영형 더미 입금');
    const tables = {};
    for (const name of [
      'group',
      'teamMember',
      'member',
      'company',
      'person',
      'opportunity',
      'onboarding',
      'deposit',
    ])
      tables[name] = ['company', 'person', 'opportunity'].includes(name)
        ? name
        : '_' + name;
    const cols = {};
    for (const [obj, table] of Object.entries(tables))
      cols[obj] = new Set(
        (
          await c.query(
            'select column_name from information_schema.columns where table_schema=$1 and table_name=$2',
            [schema, table],
          )
        ).rows.map((x) => x.column_name),
      );
    const put = async (obj, key, values) => {
      const row = {
        id: id(key),
        createdByName: '로컬 더미 생성',
        updatedByName: '로컬 더미 생성',
        ...values,
      };
      const entries = Object.entries(row).filter(([k]) => cols[obj].has(k));
      const names = entries.map(([k]) => '"' + k + '"');
      await c.query(
        `insert into "${schema}"."${tables[obj]}" (${names.join(',')}) values (${entries.map((_, i) => '$' + (i + 1)).join(',')}) on conflict(id) do update set ${names
          .filter((x) => x !== '"id"')
          .map((x) => x + '=EXCLUDED.' + x)
          .join(',')}`,
        entries.map(([, v]) => v),
      );
    };
    const day = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    };
    const stages = (
      await c.query(
        'select options from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2',
        [objects.opportunity, 'customStage'],
      )
    ).rows[0].options.map((o) => o.value);
    const groups = ['AX센터', '1BU', '2BU', '캠퍼스BU', '빈 그룹'];
    const memberNames = [
      '한스 더미',
      '피터 더미',
      '루나 더미',
      '민준 더미',
      '서연 더미',
      '도윤 더미',
    ];
    const memberGroups = [0, 0, 0, 1, 2, 3];
    const companyNames = [
      '라온테크',
      '푸른식품',
      '새봄교육',
      '다온물류',
      '한빛바이오',
      '온유디자인',
      '구름소프트',
      '가람제조',
      '해솔커머스',
      '누리서비스',
      '오름헬스',
      '별빛문화',
    ];
    await c.query('BEGIN');
    try {
      for (let g = 0; g < groups.length; g++)
        await put('group', 'group-' + g, {
          name: '[더미] ' + groups[g],
          position: g - 100,
        });
      for (let m = 0; m < memberNames.length; m++) {
        const data = { name: '[더미] ' + memberNames[m], position: m - 100 };
        await put('teamMember', 'member-' + m, {
          ...data,
          currentGroupId: id('group-' + memberGroups[m]),
          employmentStatus: 'ACTIVE',
        });
      }
      for (let i = 0; i < companyNames.length; i++) {
        const m = i % memberNames.length,
          g = memberGroups[m],
          name = '[더미] ' + companyNames[i],
          mid = id('member-' + m),
          gid = id('group-' + g),
          cid = id('company-' + i);
        await put('company', 'company-' + i, {
          name,
          position: i - 100,
          domainNamePrimaryLinkUrl: `https://demo-${i + 1}.example.com`,
          createdAt: day(-i) + 'T09:00:00+09:00',
        });
        await put('person', 'person-' + i, {
          nameFirstName: '담당자' + (i + 1),
          nameLastName: '[더미]',
          companyId: cid,
          position: i - 100,
          createdAt: day(-i) + 'T09:00:00+09:00',
        });
        await put('opportunity', 'opportunity-' + i, {
          name: name + ' AX 도입 문의',
          companyId: cid,
          assigneeId: mid,
          customStage: stages[i % stages.length],
          firstInquiryDate: day(-i),
          amountAmountMicros: (3000000 + i * 500000) * 1000000,
          amountCurrencyCode: 'KRW',
          position: i - 100,
          createdAt: day(-i) + 'T09:00:00+09:00',
        });
        await put('onboarding', 'onboarding-' + i, {
          name: name + ' AX 컨설팅',
          companyId: cid,
          gyeyagGieobId: cid,
          munyiGihoeId: id('opportunity-' + i),
          onboardingStatus: ['ACTIVE', 'ACTIVE', 'PRE', 'DONE'][i % 4],
          leadConsultant: memberNames[m],
          executionConsultant: memberNames[m],
          leadConsultantId: mid,
          executionConsultantId: mid,
          contractStartDate: day(i % 4 === 2 ? 7 : -45),
          contractEndDate: day(i % 4 === 3 ? -2 : i % 3 === 0 ? 7 : 90),
          visitDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'][i % 5],
          visitCadence: 'WEEKLY',
          totalFeeAmountMicros: (12000000 + i * 1000000) * 1000000,
          totalFeeCurrencyCode: 'KRW',
          position: i - 100,
        });
        for (let j = 0; j < 3; j++)
          await put('deposit', `deposit-${i}-${j}`, {
            name: name + ` ${j + 1}차 입금`,
            companyId: cid,
            ibgeumHoesaId: cid,
            onboardingId: id('onboarding-' + i),
            creatorId: mid,
            revenueDeptId: gid,
            maeculGwisogBuseoBuId: gid,
            depositStatus: ['PAID', 'ISSUED', 'SCHEDULED'][j],
            expectedPaymentDate: day([-3, -1, 3][j]),
            issueDate: day(-5),
            amountAmountMicros: (1000000 + i * 100000) * 1000000,
            amountCurrencyCode: 'KRW',
            position: i * 3 + j - 100,
          });
      }
      await c.query('COMMIT');
      console.log(
        JSON.stringify({
          groups: 5,
          teamMembers: 6,

          companies: 12,
          people: 12,
          opportunities: 12,
          onboardings: 12,
          deposits: 36,
          prefix: '[더미]',
        }),
      );
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }
    // Verify real API resolves the production-shaped relation, not only SQL rows.
    console.log(
      JSON.stringify(
        await gql(
          'query($id:UUID!){teamMembers(filter:{currentGroupId:{eq:$id}}){edges{node{id name currentGroup{id name} employmentStatus}}}}',
          { id: id('group-0') },
          'graphql',
        ),
      ),
    );
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
