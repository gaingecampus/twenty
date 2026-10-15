export type ContractTypeFilterOption = {
  field: 'onboardingType' | 'visitCadence';
  value: string;
};

export type ContractTypeFilter = ContractTypeFilterOption[] | null;

export const DEFAULT_CONTRACT_TYPE_FILTERS: ContractTypeFilterOption[] = [
  { field: 'onboardingType', value: 'CONSULTING' },
  { field: 'onboardingType', value: 'COACHING' },
];

export const isContractTypeFilterSelected = (
  filters: ContractTypeFilter,
  option: ContractTypeFilterOption,
) =>
  filters?.some(
    (filter) => filter.field === option.field && filter.value === option.value,
  ) ?? false;

export const toggleContractTypeFilter = (
  filters: ContractTypeFilter,
  option: ContractTypeFilterOption,
): ContractTypeFilter =>
  isContractTypeFilterSelected(filters, option)
    ? (filters ?? []).filter(
        (filter) =>
          filter.field !== option.field || filter.value !== option.value,
      )
    : [...(filters ?? []), option];

export const matchesContractTypeFilter = (
  contract: Record<string, unknown>,
  filters: ContractTypeFilter,
) =>
  filters === null ||
  filters.some((filter) => contract[filter.field] === filter.value);
