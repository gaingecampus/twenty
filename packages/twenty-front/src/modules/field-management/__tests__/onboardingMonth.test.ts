import {
  formatOnboardingMonth,
  isOnboardingMonthField,
  normalizeOnboardingMonth,
} from '@/field-management/onboardingMonth';

describe('onboarding month', () => {
  it.each(['2026-2', '2026/2', '2026.2', '2026년 2월'])(
    'normalizes %s without timezone conversion',
    (value) => {
      expect(normalizeOnboardingMonth(value)).toBe('2026-02');
      expect(formatOnboardingMonth(value)).toBe('2026년 2월');
    },
  );
  it.each(['2026-00', '2026-13', '11월', '2026-11-01', '2026년 2월, 미정'])(
    'does not reinterpret ambiguous value %s',
    (value) => {
      expect(normalizeOnboardingMonth(value)).toBeNull();
      expect(formatOnboardingMonth(value)).toBe(value);
    },
  );
  it('applies only to the contract onboarding month field', () => {
    expect(
      isOnboardingMonthField({
        fieldName: 'onboardingMonths',
        objectMetadataNameSingular: 'onboarding',
      }),
    ).toBe(true);
    expect(
      isOnboardingMonthField({
        fieldName: 'onboardingMonths',
        objectMetadataNameSingular: 'person',
      }),
    ).toBe(false);
  });
});

it.each([
  ['2026-03, 2026-06', '2026-03, 2026-06'],
  [
    '2026년 8,9,10,11,12월 2027년 1,2월',
    '2026-08, 2026-09, 2026-10, 2026-11, 2026-12, 2027-01, 2027-02',
  ],
  ['2026.10,11,12. 2027.01,02', '2026-10, 2026-11, 2026-12, 2027-01, 2027-02'],
  ['2026-02, 2026-01, 2026-02', '2026-01, 2026-02'],
])('preserves all explicit months in %s', (value, expected) => {
  expect(normalizeOnboardingMonth(value)).toBe(expected);
});
it('formats every month and leaves unresolved text intact', () => {
  expect(formatOnboardingMonth('2026-12, 2027-01')).toBe(
    '2026년 12월, 2027년 1월',
  );
  expect(formatOnboardingMonth('8월, 9월')).toBe('8월, 9월');
});
