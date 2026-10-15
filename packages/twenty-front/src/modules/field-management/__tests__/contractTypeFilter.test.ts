import {
  matchesContractTypeFilter,
  toggleContractTypeFilter,
  DEFAULT_CONTRACT_TYPE_FILTERS,
} from '@/field-management/contractTypeFilter';

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
        [filter],
      ),
    ).toBe(true);
    expect(
      matchesContractTypeFilter({ onboardingType: 'COACHING' }, [filter]),
    ).toBe(false);
    expect(matchesContractTypeFilter({}, [filter])).toBe(false);
  });
  it('matches project cadence independently of service type', () => {
    const filter = { field: 'visitCadence', value: 'PROJECT' } as const;
    expect(
      matchesContractTypeFilter(
        { onboardingType: 'DEVELOPMENT', visitCadence: 'PROJECT' },
        [filter],
      ),
    ).toBe(true);
    expect(
      matchesContractTypeFilter(
        { onboardingType: 'DEVELOPMENT', visitCadence: 'WEEKLY' },
        [filter],
      ),
    ).toBe(false);
  });
});

it('includes consulting and coaching by default with union matching', () => {
  expect(
    matchesContractTypeFilter(
      { onboardingType: 'CONSULTING' },
      DEFAULT_CONTRACT_TYPE_FILTERS,
    ),
  ).toBe(true);
  expect(
    matchesContractTypeFilter(
      { onboardingType: 'COACHING' },
      DEFAULT_CONTRACT_TYPE_FILTERS,
    ),
  ).toBe(true);
  expect(
    matchesContractTypeFilter(
      { onboardingType: 'DEVELOPMENT' },
      DEFAULT_CONTRACT_TYPE_FILTERS,
    ),
  ).toBe(false);
});
it('toggles independent options without clearing the other selections', () => {
  const project = { field: 'visitCadence', value: 'PROJECT' } as const;
  const filters = toggleContractTypeFilter(
    DEFAULT_CONTRACT_TYPE_FILTERS,
    project,
  );
  expect(filters).toHaveLength(3);
  expect(
    matchesContractTypeFilter(
      { onboardingType: 'DEVELOPMENT', visitCadence: 'PROJECT' },
      filters,
    ),
  ).toBe(true);
  expect(toggleContractTypeFilter(filters, project)).toEqual(
    DEFAULT_CONTRACT_TYPE_FILTERS,
  );
  expect(toggleContractTypeFilter(null, project)).toEqual([project]);
  expect(toggleContractTypeFilter([project], project)).toEqual([]);
  expect(matchesContractTypeFilter({ visitCadence: 'PROJECT' }, [])).toBe(
    false,
  );
});
