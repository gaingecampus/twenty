import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
export const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';
export const relationId = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'id' in value
      ? text(value.id)
      : '';
export const contractId = (visit: ObjectRecord) =>
  relationId(visit.contractId) || relationId(visit.contract);
export const companyId = (contract: ObjectRecord) =>
  relationId(contract.companyId) || relationId(contract.company);
export const assigned = (
  contract: ObjectRecord,
  memberId: string,
  links: ObjectRecord[],
  includeLead = false,
) =>
  !!memberId &&
  (relationId(contract.executionConsultantId) === memberId ||
    (includeLead && relationId(contract.leadConsultantId) === memberId) ||
    links.some(
      (link) =>
        relationId(link.gyeyagId) === contract.id &&
        relationId(link.guseongweonId) === memberId,
    ));
export const visitsFor = (visits: ObjectRecord[], id: string) =>
  visits
    .filter((visit) => contractId(visit) === id)
    .sort(
      (a, b) =>
        text(b.visitDate).localeCompare(text(a.visitDate)) ||
        text(b.createdAt).localeCompare(text(a.createdAt)) ||
        b.id.localeCompare(a.id),
    );
export const visitMetrics = (
  contracts: ObjectRecord[],
  visits: ObjectRecord[],
  start?: string,
  end?: string,
) => {
  const ids = new Set(contracts.map((c) => c.id));
  const submitted = visits.filter(
    (v) => ids.has(contractId(v)) && v.recordStatus === 'SUBMITTED',
  );
  return {
    goals: contracts.filter((c) => text(c.consultingGoal).trim()).length,
    withoutRecord: contracts.filter(
      (c) => !submitted.some((v) => contractId(v) === c.id),
    ).length,
    submitted: submitted.filter(
      (v) =>
        (!start || text(v.visitDate) >= start) &&
        (!end || text(v.visitDate).slice(0, 10) <= end),
    ).length,
  };
};

export const contractDateLabel = (value: unknown): string =>
  text(value).slice(0, 10).replace(/-/g, '.');
