import { matchesContractTypeFilter } from '@/field-management/contractTypeFilter';

describe('contract type filter', () => {
  it('shows every type including missing values for all', () => {
    expect(matchesContractTypeFilter({}, null)).toBe(true);
    expect(
      matchesContractTypeFilter({ onboardingType: 'COACHING' }, null),
    ).toBe(true);
  });
  it('matches the stored type, not the contract name or cadence', () => {
    const filter = { field: 'onboardingType', value: 'CONSULTING' } as const;
    expect(
      matchesContractTypeFilter(
        { onboardingType: 'CONSULTING', visitCadence: 'PROJECT' },
        filter,
      ),
    ).toBe(true);
    expect(
      matchesContractTypeFilter({ onboardingType: 'COACHING' }, filter),
    ).toBe(false);
    expect(matchesContractTypeFilter({}, filter)).toBe(false);
  });
  it('matches project cadence independently of service type', () => {
    const filter = { field: 'visitCadence', value: 'PROJECT' } as const;
    expect(
      matchesContractTypeFilter(
        { onboardingType: 'DEVELOPMENT', visitCadence: 'PROJECT' },
        filter,
      ),
    ).toBe(true);
    expect(
      matchesContractTypeFilter(
        { onboardingType: 'DEVELOPMENT', visitCadence: 'WEEKLY' },
        filter,
      ),
    ).toBe(false);
  });
});
