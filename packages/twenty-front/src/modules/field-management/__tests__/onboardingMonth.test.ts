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
  it.each(['2026-00', '2026-13', '11월', '2026-11-01', '2026년 2월, 3월'])(
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
