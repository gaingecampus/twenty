import { DateFormat } from '@/localization/constants/DateFormat';
import { TimeFormat } from '@/localization/constants/TimeFormat';
import {
  getLocalizedDateFormat,
  getLocalizedTimeFormat,
} from '@/localization/utils/getLocalizedDateTimeFormat';
import { enUS, fr, ko } from 'date-fns/locale';

describe('getLocalizedDateFormat', () => {
  it('should keep English date formats unchanged', () => {
    expect(getLocalizedDateFormat(DateFormat.YEAR_FIRST, enUS)).toBe(
      DateFormat.YEAR_FIRST,
    );
    expect(getLocalizedDateFormat(DateFormat.MONTH_FIRST, enUS)).toBe(
      DateFormat.MONTH_FIRST,
    );
    expect(getLocalizedDateFormat(DateFormat.DAY_FIRST, fr)).toBe(
      DateFormat.DAY_FIRST,
    );
  });

  it('should add Korean year and day suffixes', () => {
    expect(getLocalizedDateFormat(DateFormat.YEAR_FIRST, ko)).toBe(
      'yyyy년 M월 d일',
    );
    expect(getLocalizedDateFormat(DateFormat.MONTH_FIRST, ko)).toBe(
      'M월 d일, yyyy년',
    );
    expect(getLocalizedDateFormat(DateFormat.DAY_FIRST, ko)).toBe(
      'd일 M월, yyyy년',
    );
  });

  it('should keep SYSTEM format unchanged', () => {
    expect(getLocalizedDateFormat(DateFormat.SYSTEM, ko)).toBe(
      DateFormat.SYSTEM,
    );
  });
});

describe('getLocalizedTimeFormat', () => {
  it('should keep English time formats unchanged', () => {
    expect(getLocalizedTimeFormat(TimeFormat.HOUR_12, enUS)).toBe(
      TimeFormat.HOUR_12,
    );
    expect(getLocalizedTimeFormat(TimeFormat.HOUR_24, enUS)).toBe(
      TimeFormat.HOUR_24,
    );
  });

  it('should place Korean day period before the time', () => {
    expect(getLocalizedTimeFormat(TimeFormat.HOUR_12, ko)).toBe('a h:mm');
  });

  it('should keep 24-hour format unchanged for Korean', () => {
    expect(getLocalizedTimeFormat(TimeFormat.HOUR_24, ko)).toBe(
      TimeFormat.HOUR_24,
    );
  });
});
