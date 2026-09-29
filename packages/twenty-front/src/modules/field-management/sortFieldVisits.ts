import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { text } from './fieldManagementUtils';
export type FieldVisitSortKey =
  | 'visitDate'
  | 'createdAt'
  | 'sessionNumber'
  | 'name';
export const sortFieldVisits = (
  visits: ObjectRecord[],
  key: FieldVisitSortKey,
  direction: 'asc' | 'desc',
) => {
  const value = (visit: ObjectRecord): string | number | undefined => {
    if (key === 'sessionNumber')
      return typeof visit.sessionNumber === 'number' &&
        Number.isFinite(visit.sessionNumber)
        ? visit.sessionNumber
        : undefined;
    const raw = text(visit[key]).trim();
    if (!raw) return undefined;
    if (key === 'name') return raw;
    const date = Date.parse(raw);
    return Number.isNaN(date) ? undefined : date;
  };
  return [...visits].sort((a, b) => {
    const left = value(a),
      right = value(b);
    // Missing values always appear last, including ascending order.
    if (left === undefined && right !== undefined) return 1;
    if (right === undefined && left !== undefined) return -1;
    const comparison =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left ?? '').localeCompare(String(right ?? ''), 'ko', {
            numeric: true,
          });
    return (
      comparison * (direction === 'asc' ? 1 : -1) ||
      text(b.createdAt).localeCompare(text(a.createdAt)) ||
      a.id.localeCompare(b.id)
    );
  });
};
