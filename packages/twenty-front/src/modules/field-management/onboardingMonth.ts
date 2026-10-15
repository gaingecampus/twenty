export const isOnboardingMonthField = (metadata: {
  fieldName: string;
  objectMetadataNameSingular?: string;
}) =>
  metadata.objectMetadataNameSingular === 'onboarding' &&
  metadata.fieldName === 'onboardingMonths';

export const normalizeOnboardingMonth = (value: string): string | null => {
  const match = value
    .trim()
    .match(/^(\d{4})(?:[-/.]|\s*년\s*)(\d{1,2})\s*월?$/);
  if (
    !match ||
    Number(match[1]) < 1 ||
    Number(match[2]) < 1 ||
    Number(match[2]) > 12
  )
    return null;
  return `${match[1]}-${match[2].padStart(2, '0')}`;
};

export const formatOnboardingMonth = (value: string): string => {
  const normalized = normalizeOnboardingMonth(value);
  if (!normalized) return value;
  const [year, month] = normalized.split('-');
  return `${year}년 ${Number(month)}월`;
};
