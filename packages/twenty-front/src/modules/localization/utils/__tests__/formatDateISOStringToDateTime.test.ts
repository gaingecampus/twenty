import { DateFormat } from '@/localization/constants/DateFormat';
import { TimeFormat } from '@/localization/constants/TimeFormat';
import { formatDateISOStringToDateTime } from '@/localization/utils/formatDateISOStringToDateTime';
import { enUS, ko } from 'date-fns/locale';

describe('formatDateISOStringToDateTime', () => {
  it('should format English year-first 12-hour datetime', () => {
    const result = formatDateISOStringToDateTime({
      date: '2026-08-04T13:35:00.000Z',
      timeZone: 'UTC',
      dateFormat: DateFormat.YEAR_FIRST,
      timeFormat: TimeFormat.HOUR_12,
      localeCatalog: enUS,
    });

    expect(result).toBe('2026 Aug 4 1:35 PM');
  });

  it('should format Korean year-first 12-hour datetime with year and day suffixes', () => {
    const result = formatDateISOStringToDateTime({
      date: '2026-08-04T13:35:00.000Z',
      timeZone: 'UTC',
      dateFormat: DateFormat.YEAR_FIRST,
      timeFormat: TimeFormat.HOUR_12,
      localeCatalog: ko,
    });

    expect(result).toBe('2026년 8월 4일 오후 1:35');
  });

  it('should place 오전 before the time for Korean morning hours', () => {
    const result = formatDateISOStringToDateTime({
      date: '2026-08-04T01:35:00.000Z',
      timeZone: 'UTC',
      dateFormat: DateFormat.YEAR_FIRST,
      timeFormat: TimeFormat.HOUR_12,
      localeCatalog: ko,
    });

    expect(result).toBe('2026년 8월 4일 오전 1:35');
  });

  it('should keep 24-hour time after the Korean date', () => {
    const result = formatDateISOStringToDateTime({
      date: '2026-08-04T13:35:00.000Z',
      timeZone: 'UTC',
      dateFormat: DateFormat.YEAR_FIRST,
      timeFormat: TimeFormat.HOUR_24,
      localeCatalog: ko,
    });

    expect(result).toBe('2026년 8월 4일 13:35');
  });

  it('should return an empty string for an invalid date', () => {
    const result = formatDateISOStringToDateTime({
      date: 'invalid-date',
      timeZone: 'UTC',
      dateFormat: DateFormat.YEAR_FIRST,
      timeFormat: TimeFormat.HOUR_12,
      localeCatalog: ko,
    });

    expect(result).toBe('');
  });
});
