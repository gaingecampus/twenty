export const isOnboardingMonthField = (metadata: {
  fieldName: string;
  objectMetadataNameSingular?: string;
}) =>
  metadata.objectMetadataNameSingular === 'onboarding' &&
  metadata.fieldName === 'onboardingMonths';

// A year applies to following months until another explicit year appears.
// Unrecognized text is never partially converted or discarded.
export const parseOnboardingMonths = (value: string): string[] | null => {
  if (!value.trim()) return [];
  const tokens = /(?:(\d{4})\s*(?:년|[-/.])\s*)?(\d{1,2})\s*월?/g;
  let year: string | undefined;
  let end = 0;
  const months: string[] = [];
  for (const match of value.matchAll(tokens)) {
    if (!/^[\s,./]*$/.test(value.slice(end, match.index))) return null;
    year = match[1] ?? year;
    const month = Number(match[2]);
    if (!year || Number(year) < 1 || month < 1 || month > 12) return null;
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    end = match.index + match[0].length;
  }
  if (!months.length || !/^[\s,./]*$/.test(value.slice(end))) return null;
  return [...new Set(months)].sort();
};

export const normalizeOnboardingMonth = (value: string): string | null => {
  const months = parseOnboardingMonths(value);
  return months?.length ? months.join(', ') : null;
};

export const formatOnboardingMonth = (value: string): string => {
  const months = parseOnboardingMonths(value);
  if (!months?.length) return value;
  return months
    .map((monthValue) => {
      const [year, month] = monthValue.split('-');
      return `${year}년 ${Number(month)}월`;
    })
    .join(', ');
};
