import { detectDateFormat } from '@/localization/utils/detection/detectDateFormat';
import { type Temporal } from 'temporal-polyfill';
import { WorkspaceMemberDateFormatEnum } from '~/generated-metadata/graphql';

export const formatZonedDateTimeDatePart = (
  zonedDateTime: Temporal.ZonedDateTime,
  dateFormat: WorkspaceMemberDateFormatEnum,
  locale = 'en-US',
): string => {
  const MMM = zonedDateTime.toLocaleString(locale, { month: 'short' });
  const isKorean = locale.startsWith('ko');
  const d = `${zonedDateTime.day}${isKorean ? '일' : ''}`;
  const yyyy = `${zonedDateTime.year}${isKorean ? '년' : ''}`;

  switch (dateFormat) {
    case WorkspaceMemberDateFormatEnum.SYSTEM: {
      const detectedFormat = WorkspaceMemberDateFormatEnum[detectDateFormat()];

      return formatZonedDateTimeDatePart(zonedDateTime, detectedFormat, locale);
    }
    case WorkspaceMemberDateFormatEnum.MONTH_FIRST:
      return `${MMM} ${d}, ${yyyy}`;
    case WorkspaceMemberDateFormatEnum.DAY_FIRST:
      return `${d} ${MMM}, ${yyyy}`;
    case WorkspaceMemberDateFormatEnum.YEAR_FIRST:
      return `${yyyy} ${MMM} ${d}`;
  }
};
