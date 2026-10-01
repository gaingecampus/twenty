import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { contractId } from './fieldManagementUtils';

export const getContractSessionProgress = (
  contract: ObjectRecord,
  visits: ObjectRecord[],
) => {
  const current = visits.reduce((highest, visit) => {
    const session = visit.sessionNumber;
    return contractId(visit) === contract.id &&
      visit.recordStatus === 'SUBMITTED' &&
      typeof session === 'number' &&
      Number.isSafeInteger(session) &&
      session > 0
      ? Math.max(highest, session)
      : highest;
  }, 0);
  const planned = contract.plannedSessionCount;
  const total =
    typeof planned === 'number' && Number.isSafeInteger(planned) && planned > 0
      ? planned
      : null;
  return {
    current,
    total,
    percent:
      total === null
        ? null
        : Math.min(100, Math.round((current / total) * 100)),
  };
};
