import { type DateFormat } from '@/localization/constants/DateFormat';
import { type TimeFormat } from '@/localization/constants/TimeFormat';
import {
  getLocalizedDateFormat,
  getLocalizedTimeFormat,
} from '@/localization/utils/getLocalizedDateTimeFormat';
import { isValid, type Locale } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const formatDateISOStringToDateTime = ({
  date,
  timeZone,
  dateFormat,
  timeFormat,
  localeCatalog,
}: {
  date: string;
  timeZone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  localeCatalog: Locale;
}) => {
  const parsedDate = new Date(date);

  if (!isValid(parsedDate)) {
    return '';
  }

  const localizedDateFormat = getLocalizedDateFormat(
    dateFormat,
    localeCatalog,
  );
  const localizedTimeFormat = getLocalizedTimeFormat(
    timeFormat,
    localeCatalog,
  );

  // TODO: replace this with shiftPointInTimeToFromTimezoneDifference to remove date-fns-tz, which formatInTimeZone is doig under the hood :
  // https://github.com/marnusw/date-fns-tz/blob/4f3383b26a5907a73b14512a2701f3dfd8cf1579/src/toZonedTime/index.ts#L36C9-L36C27
  return formatInTimeZone(
    parsedDate,
    timeZone,
    `${localizedDateFormat} ${localizedTimeFormat}`,
    {
      locale: localeCatalog,
    },
  );
};
