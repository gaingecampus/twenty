import { type DateFormat } from '@/localization/constants/DateFormat';
import { formatPlainDateISOString } from '@/localization/utils/formatPlainDateISOString';
import { getLocalizedDateFormat } from '@/localization/utils/getLocalizedDateTimeFormat';
import { type Locale } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { isDateWithoutTime } from 'twenty-shared/utils';

export const formatDateISOStringToDate = ({
  date,
  timeZone,
  dateFormat,
  localeCatalog,
}: {
  date: string;
  timeZone: string;
  dateFormat: DateFormat;
  localeCatalog?: Locale;
}) => {
  const localizedDateFormat = getLocalizedDateFormat(
    dateFormat,
    localeCatalog,
  );

  if (isDateWithoutTime(date)) {
    return formatPlainDateISOString({
      date,
      dateFormat: localizedDateFormat,
      localeCatalog,
    });
  }

  return formatInTimeZone(new Date(date), timeZone, localizedDateFormat, {
    locale: localeCatalog,
  });
};
