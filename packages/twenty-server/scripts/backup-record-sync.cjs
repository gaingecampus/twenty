// Local imports only. Row coordinates and file hashes are provenance, never keys.
const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs');

const identityFields = [
  ['backupId', '고정 백업 ID', 'TEXT'],
  ['backupScope', '백업 원본 범위', 'TEXT'],
  ['backupBaseline', '마지막 가져오기 비교값', 'TEXT'],
];
const provenance = new Set([
  'id',
  'sourceRow',
  'sourceKey',
  'sourceUrl',
  'sourceHash',
  'sourceSheet',
  'capturedAt',
  'sourceDetails',
  'sourceExtraNotes',
  'backupId',
  'backupScope',
  'backupBaseline',
]);
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const canonical = (value) =>
  JSON.stringify(value, (_, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
const equal = (left, right) =>
  canonical(left ?? null) === canonical(right ?? null);
const scopeOf = (kind, row) =>
  row.backupScope ||
  (kind === 'pendingExpense'
    ? String(row.sourceKey || '')
        .split(':')
        .slice(0, -1)
        .join(':')
    : `${kind}:${row.bankKey || ''}:${row.sourceSheet || ''}`);

function business(row) {
  const result = Object.fromEntries(
    Object.entries(row).filter(([key]) => !provenance.has(key)),
  );
  // Template labels used to contain a source row coordinate.
  if (row.sourceRecordType && result.name)
    result.name = result.name.replace(/\d+행$/, '보충 행');
  return result;
}

function redactPayroll(kind, row) {
  if (
    kind !== 'bankTransaction' ||
    !/급여|상여|성과급|퇴직금/.test(
      [row.name, row.description, row.sourceDetails].join(' '),
    )
  )
    return row;
  return {
    ...row,
    name: `${row.bankName} ${new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(row.transactionAt))} 급여 (대상자 비공개)`,
    description: '급여 (대상자 비공개)',
    sourceDetails: '급여: 대상자와 원문 비공개',
  };
}

function fingerprint(row) {
  return createHash('sha256')
    .update(canonical(business(row)))
    .digest('hex');
}

function getFromMonth(args = process.argv, fallback) {
  const index = args.indexOf('--from-month');
  const month =
    index >= 0
      ? args[index + 1]
      : fallback ||
        new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
        }).format(new Date());
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || ''))
    throw Error('Invalid --from-month (YYYY-MM)');
  return month;
}

function inWindow(kind, row, fromMonth) {
  if (!fromMonth) return true;
  if (kind === 'pendingExpense')
    return (
      !row.sourceRecordType &&
      /^\d{4}-(0[1-9]|1[0-2])$/.test(row.expenseMonth || '') &&
      row.expenseMonth >= fromMonth
    );
  if (kind === 'expectedReceipt')
    return String(row.expectedDate || '').slice(0, 7) >= fromMonth;
  const date = new Date(row.transactionAt);
  if (!Number.isFinite(date.getTime())) return false;
  return (
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
    }).format(date) >= fromMonth
  );
}

function projectRow(stored, fields) {
  const row = { id: stored.id, name: stored.name ?? null };
  for (const [name, , type] of fields) {
    if (type === 'CURRENCY') {
      row[name] =
        stored[`${name}AmountMicros`] == null
          ? null
          : {
              amountMicros: String(stored[`${name}AmountMicros`]),
              currencyCode: stored[`${name}CurrencyCode`],
            };
    } else if (type === 'LINKS') {
      row[name] = {
        primaryLinkUrl: stored[`${name}PrimaryLinkUrl`] ?? null,
        primaryLinkLabel: stored[`${name}PrimaryLinkLabel`] ?? null,
        secondaryLinks: stored[`${name}SecondaryLinks`] ?? [],
      };
    } else if (type === 'DATE') {
      const value = stored[name];
      row[name] =
        value instanceof Date
          ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
          : (value ?? null);
    } else if (type === 'DATE_TIME') {
      row[name] =
        stored[name] == null ? null : new Date(stored[name]).toISOString();
    } else row[name] = stored[name] ?? null;
  }
  return row;
}

function normalizeInput(row, fields) {
  const result = { name: row.name ?? null };
  for (const [name, , type] of fields) {
    if (identityFields.some(([field]) => name === field)) continue;
    const value = row[name];
    result[name] =
      type === 'DATE_TIME' && value != null
        ? new Date(value).toISOString()
        : type === 'LINKS'
          ? {
              primaryLinkUrl: value?.primaryLinkUrl ?? null,
              primaryLinkLabel: value?.primaryLinkLabel ?? null,
              secondaryLinks: value?.secondaryLinks ?? [],
            }
          : (value ?? null);
  }
  return result;
}

// Strict full-scope reconciliation: unknown edits/deletions must not become inserts.
// Identical duplicates are a multiset; a changed multiplicity requires explicit IDs.
function planSync({ kind, fields, incoming, existing, fromMonth }) {
  const allPrevious = existing
    .map((stored) => {
      const original = projectRow(stored, fields);
      const current = redactPayroll(kind, original);
      const baseline = current.backupBaseline
        ? redactPayroll(kind, JSON.parse(current.backupBaseline))
        : null;
      return {
        stored,
        original,
        current,
        baseline,
        scope: scopeOf(kind, current),
      };
    })
    .filter((entry) => entry.scope);
  const previous = allPrevious.filter(({ current }) =>
    inWindow(kind, current, fromMonth),
  );
  const historyIds = new Set(
    allPrevious
      .filter(({ current }) => !inWindow(kind, current, fromMonth))
      .flatMap(({ current }) => [current.id, current.backupId]),
  );
  const used = new Set();
  const identities = new Set();
  const plans = [];
  const sourceScopes = new Set(incoming.map((row) => scopeOf(kind, row)));
  const staged = incoming
    .filter((row) => inWindow(kind, row, fromMonth))
    .map((raw) => {
      const scope = scopeOf(kind, raw);
      if (!scope) throw Error('Missing backup source scope');
      if (raw.backupId && !uuid.test(raw.backupId))
        throw Error('Invalid fixed backup ID');
      if (raw.backupId && historyIds.has(raw.backupId))
        throw Error('Cannot move a historical record into the update window');
      return {
        raw,
        scope,
        source: redactPayroll(kind, normalizeInput(raw, fields)),
      };
    });
  const byIdentity = new Map();
  const byFingerprint = new Map();
  for (const entry of previous) {
    const identity = entry.current.backupId || entry.current.id;
    if (!byIdentity.has(identity)) byIdentity.set(identity, []);
    byIdentity.get(identity).push(entry);
    const key = `${entry.scope}:${fingerprint(entry.baseline || entry.current)}`;
    if (!byFingerprint.has(key)) byFingerprint.set(key, []);
    byFingerprint.get(key).push(entry);
  }
  // Resolve explicit IDs first, before matching indistinguishable source rows.
  for (const item of staged.filter(({ raw }) => raw.backupId)) {
    let matches = byIdentity.get(item.raw.backupId) || [];
    if (!matches.length)
      matches = (
        byFingerprint.get(`${item.scope}:${fingerprint(item.source)}`) || []
      ).filter(
        (entry) =>
          !used.has(entry.current.id) &&
          !entry.current.backupId &&
          entry.scope === item.scope,
      );
    if (matches.length > 1) throw Error('Duplicate stored backup ID');
    if (matches[0] && matches[0].scope !== item.scope)
      throw Error('Backup ID belongs to another source');
    item.match = matches[0];
    if (item.match) used.add(item.match.current.id);
  }
  const groups = new Map();
  for (const item of staged.filter(({ raw }) => !raw.backupId)) {
    const key = `${item.scope}:${fingerprint(item.source)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const [key, items] of groups) {
    const candidates = (byFingerprint.get(key) || [])
      .filter(
        (entry) =>
          !used.has(entry.current.id) && entry.scope === items[0].scope,
      )
      .sort((left, right) => left.current.id.localeCompare(right.current.id));
    if (candidates.length && candidates.length !== items.length)
      throw Error(
        `Ambiguous duplicate count (${candidates.length} stored / ${items.length} incoming, source rows ${items.map(({ raw }) => raw.sourceRow).join(',')}): retain CRM 백업 ID before importing`,
      );
    items.forEach((item, index) => {
      item.match = candidates[index];
      if (item.match) used.add(item.match.current.id);
    });
  }
  const unresolved = previous.filter(
    (entry) => sourceScopes.has(entry.scope) && !used.has(entry.current.id),
  );
  if (unresolved.length)
    throw Error(
      `Unmatched existing rows (${unresolved.length}): restore fixed IDs or review changes/deletions; no data written`,
    );
  for (const { raw, scope, source, match } of staged) {
    if (match?.stored.deletedAt)
      throw Error('Previously deleted row requires review');
    const id = match?.current.id || raw.backupId || randomUUID();
    const backupId = match?.current.backupId || raw.backupId || id;
    if (identities.has(backupId)) throw Error('Duplicate incoming backup ID');
    identities.add(backupId);
    if (kind === 'pendingExpense') source.sourceKey = `backup:${backupId}`;
    if (
      match?.current.capturedAt &&
      source.capturedAt &&
      Date.parse(source.capturedAt) < Date.parse(match.current.capturedAt)
    )
      throw Error('Older backup cannot replace a newer import');
    const merged = { ...source };
    if (match) {
      const sourceBusiness = business(source);
      const currentBusiness = business(match.current);
      const baseBusiness = match.baseline
        ? business(match.baseline)
        : currentBusiness;
      for (const key of Object.keys(sourceBusiness)) {
        const current = currentBusiness[key];
        const base = baseBusiness[key];
        if (!equal(current, base) && !equal(current, sourceBusiness[key])) {
          // Financial imports must not silently preserve a conflicting manual override.
          throw Error(
            `CRM/source conflict: ${backupId} field ${key}; no data written`,
          );
        }
        if (!match.baseline && !equal(current, sourceBusiness[key]))
          throw Error(
            `Legacy row differs: ${backupId} field ${key}; no data written`,
          );
      }
    }
    Object.assign(merged, {
      id,
      backupId,
      backupScope: scope,
      backupBaseline: canonical(source),
    });
    plans.push({
      sourceLocation: {
        sourceRow: raw.sourceRow,
        sourceSheet: raw.sourceSheet,
      },
      action: !match
        ? 'insert'
        : equal(merged, match.original)
          ? 'unchanged'
          : 'update',
      row: merged,
    });
  }
  return plans;
}

const quote = (identifier) => `"${identifier.replaceAll('"', '""')}"`;
function columnsOf(row, fields) {
  const values = { name: row.name };
  for (const [name, , type] of fields) {
    if (type === 'CURRENCY') {
      values[`${name}AmountMicros`] = row[name]?.amountMicros ?? null;
      values[`${name}CurrencyCode`] = row[name]?.currencyCode ?? null;
    } else if (type === 'LINKS') {
      values[`${name}PrimaryLinkUrl`] = row[name]?.primaryLinkUrl ?? null;
      values[`${name}PrimaryLinkLabel`] = row[name]?.primaryLinkLabel ?? null;
      values[`${name}SecondaryLinks`] = JSON.stringify(
        row[name]?.secondaryLinks ?? [],
      );
    } else values[name] = row[name] ?? null;
  }
  return values;
}

// Caller holds one transaction for all affected objects and the snapshot flag.
async function syncTables(c, schema, batches, apply) {
  const ordered = [...batches].sort((left, right) =>
    left.kind.localeCompare(right.kind),
  );
  // Locks also prevent a CRM edit or a second importer between comparison and write.
  if (apply)
    for (const { kind } of ordered)
      await c.query(
        `LOCK TABLE ${quote(schema)}.${quote(`_${kind}`)} IN SHARE ROW EXCLUSIVE MODE`,
      );
  const result = [];
  for (const batch of ordered) {
    const table = `${quote(schema)}.${quote(`_${batch.kind}`)}`;
    const exists = (await c.query('SELECT to_regclass($1) as name', [table]))
      .rows[0].name;
    const existing = exists
      ? (await c.query(`SELECT * FROM ${table}`)).rows
      : [];
    result.push({ ...batch, table, plans: planSync({ ...batch, existing }) });
  }
  if (apply)
    for (const { plans, table, fields } of result)
      for (const { action, row } of plans) {
        if (action === 'unchanged') continue;
        const data = columnsOf(row, fields);
        data.updatedByName = '자금 흐름 백업';
        if (action === 'insert') data.createdByName = '자금 흐름 백업';
        const entries = Object.entries(data);
        if (action === 'insert') {
          await c.query(
            `INSERT INTO ${table} (${['id', ...entries.map(([key]) => key)].map(quote).join(',')}) VALUES (${Array.from({ length: entries.length + 1 }, (_, index) => `$${index + 1}`).join(',')})`,
            [row.id, ...entries.map(([, value]) => value)],
          );
        } else {
          await c.query(
            `UPDATE ${table} SET ${entries.map(([key], index) => `${quote(key)}=$${index + 2}`).join(',')}, "updatedAt"=now() WHERE id=$1`,
            [row.id, ...entries.map(([, value]) => value)],
          );
        }
      }
  if (apply)
    for (const { plans, table, fields } of result) {
      const saved = (
        await c.query(`SELECT * FROM ${table} WHERE id=ANY($1::uuid[])`, [
          plans.map(({ row }) => row.id),
        ])
      ).rows;
      const byId = new Map(
        saved.map((row) => [row.id, projectRow(row, fields)]),
      );
      if (
        saved.length !== plans.length ||
        plans.some(({ row }) => !equal(row, byId.get(row.id)))
      )
        throw Error(
          'Stored backup verification failed; transaction must roll back',
        );
    }
  return result;
}

async function hideProvenance(c, gql, objectId) {
  const rows = (
    await c.query(
      `select vf.id from core."viewField" vf join core.view v on v.id=vf."viewId" join core."fieldMetadata" f on f.id=vf."fieldMetadataId" where v."objectMetadataId"=$1 and v.type='TABLE' and f.name=ANY($2) and vf."deletedAt" is null and vf."isVisible"=true`,
      [
        objectId,
        ['sourceRow', 'sourceKey', ...identityFields.map(([name]) => name)],
      ],
    )
  ).rows;
  for (const { id } of rows)
    await gql(
      'mutation($input:UpdateViewFieldInput!){updateViewField(input:$input){id}}',
      { input: { id, update: { isVisible: false } } },
    );
}

const summarize = (results) =>
  results.map(({ kind, plans, incoming, fromMonth }) => ({
    object: kind,
    fromMonth,
    skippedHistory: incoming.length - plans.length,
    ...Object.fromEntries(
      ['insert', 'update', 'unchanged'].map((action) => [
        action,
        plans.filter((plan) => plan.action === action).length,
      ]),
    ),
  }));

function writeIdentityMap(inputPath, results) {
  const output = `${inputPath}.identities.json`;
  const rows = results.flatMap(({ kind, plans }) =>
    plans.map(({ row, sourceLocation }) => ({
      object: kind,
      backupId: row.backupId,
      backupScope: row.backupScope,
      sourceHash: row.sourceHash,
      sourceSheet: sourceLocation?.sourceSheet ?? row.sourceSheet,
      sourceRow: sourceLocation?.sourceRow,
    })),
  );
  fs.writeFileSync(output, JSON.stringify(rows, null, 2), { mode: 0o600 });
  fs.chmodSync(output, 0o600);
  console.log(JSON.stringify({ identityMap: output }));
}

module.exports = {
  identityFields,
  normalizeInput,
  projectRow,
  planSync,
  syncTables,
  hideProvenance,
  quote,
  summarize,
  writeIdentityMap,
  getFromMonth,
  inWindow,
};
