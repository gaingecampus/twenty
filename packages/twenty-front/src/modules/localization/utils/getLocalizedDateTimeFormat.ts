import { DateFormat } from '@/localization/constants/DateFormat';
import { TimeFormat } from '@/localization/constants/TimeFormat';
import { type Locale } from 'date-fns';
import { isDefined } from 'twenty-shared/utils';

const KOREAN_DATE_FORMAT_BY_DATE_FORMAT: Record<DateFormat, string> = {
  [DateFormat.SYSTEM]: DateFormat.SYSTEM,
  [DateFormat.MONTH_FIRST]: 'M월 d일, yyyy년',
  [DateFormat.DAY_FIRST]: 'd일 M월, yyyy년',
  [DateFormat.YEAR_FIRST]: 'yyyy년 M월 d일',
};

const KOREAN_TIME_FORMAT_BY_TIME_FORMAT: Record<TimeFormat, string> = {
  [TimeFormat.SYSTEM]: TimeFormat.SYSTEM,
  [TimeFormat.HOUR_24]: TimeFormat.HOUR_24,
  [TimeFormat.HOUR_12]: 'a h:mm',
};

const isKoreanLocale = (localeCatalog?: Locale) =>
  isDefined(localeCatalog?.code) && localeCatalog.code.startsWith('ko');

export const getLocalizedDateFormat = (
  dateFormat: DateFormat,
  localeCatalog?: Locale,
): string => {
  if (!isKoreanLocale(localeCatalog) || dateFormat === DateFormat.SYSTEM) {
    return dateFormat;
  }

  return KOREAN_DATE_FORMAT_BY_DATE_FORMAT[dateFormat];
};

export const getLocalizedTimeFormat = (
  timeFormat: TimeFormat,
  localeCatalog?: Locale,
): string => {
  if (!isKoreanLocale(localeCatalog) || timeFormat === TimeFormat.SYSTEM) {
    return timeFormat;
  }

  return KOREAN_TIME_FORMAT_BY_TIME_FORMAT[timeFormat];
};
