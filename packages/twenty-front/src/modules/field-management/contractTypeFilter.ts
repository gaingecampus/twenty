export type ContractTypeFilter = {
  field: 'onboardingType' | 'visitCadence';
  value: string;
} | null;

export const matchesContractTypeFilter = (
  contract: Record<string, unknown>,
  filter: ContractTypeFilter,
) => filter === null || contract[filter.field] === filter.value;
