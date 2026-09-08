export const COMPANY_ENRICHMENT_FIELDS = [
  { name: 'aiCompanyProfile', label: 'AI 기업 소개', type: 'TEXT' },
  { name: 'aiEnrichmentStatus', label: 'AI 정보 보완 상태', type: 'TEXT' },
  { name: 'aiEnrichmentSource', label: 'AI 정보 출처', type: 'TEXT' },
  { name: 'aiEnrichmentCheckedAt', label: 'AI 정보 확인일', type: 'DATE_TIME' },
  { name: 'aiEnrichmentModel', label: 'AI 정보 보완 모델', type: 'TEXT' },
] as const;
export function getCompanyWebsite(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    if (url.protocol !== 'https:' || url.username || url.password || url.port)
      return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}
export function websiteText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18000);
}
export function parseCompanyProfile(
  output: string,
  source: string,
): { profile: string; employees: number | null } | null {
  let result: unknown;
  try {
    result = JSON.parse(
      output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''),
    );
  } catch {
    return null;
  }
  if (!result || typeof result !== 'object') return null;
  const r = result as Record<string, unknown>;
  if (
    r.identityConfirmed !== true ||
    typeof r.profile !== 'string' ||
    r.profile.length < 10 ||
    r.profile.length > 1200 ||
    typeof r.quote !== 'string' ||
    r.quote.length < 10 ||
    !source.includes(r.quote)
  )
    return null;
  const employeeQuote =
    typeof r.employeeQuote === 'string' ? r.employeeQuote : '';
  const employees =
    typeof r.employees === 'number' &&
    Number.isInteger(r.employees) &&
    r.employees >= 0 &&
    r.employees <= 10000000 &&
    employeeQuote.length > 3 &&
    source.includes(employeeQuote) &&
    employeeQuote.replace(/,/g, '').includes(String(r.employees)) &&
    /직원|임직원|종업원|employees|headcount/i.test(employeeQuote)
      ? r.employees
      : null;
  return { profile: r.profile, employees };
}
