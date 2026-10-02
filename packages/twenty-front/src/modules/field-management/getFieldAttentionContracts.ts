import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getContractSessionProgress } from './getContractSessionProgress';
import { text } from './fieldManagementUtils';

export const getFieldAttentionContracts = (
  contracts: ObjectRecord[],
  visits: ObjectRecord[],
  today: string,
) => {
  const active = contracts.filter(
    (contract) => contract.onboardingStatus === 'ACTIVE',
  );
  const missingOkr = active.filter(
    (contract) =>
      !text(contract.consultingGoal).trim() ||
      !text(contract.successCriteria).trim(),
  );
  const delayed = active.filter((contract) => {
    const { current, total } = getContractSessionProgress(contract, visits);
    const start = Date.parse(text(contract.contractStartDate).slice(0, 10));
    const end = Date.parse(text(contract.contractEndDate).slice(0, 10));
    const now = Date.parse(today);
    if (
      total === null ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end < start ||
      now < start
    )
      return false;
    const day = 86400000;
    const elapsed = Math.min(end - start + day, Math.max(0, now - start));
    const expected = Math.floor((total * elapsed) / (end - start + day));
    return current < expected;
  });
  const unplanned = active.filter(
    (contract) => getContractSessionProgress(contract, visits).total === null,
  );
  return { missingOkr, delayed, unplanned };
};
