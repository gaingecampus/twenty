import { useLingui } from '@lingui/react/macro';
import { useUserDateFormat } from '@/ui/input/components/internal/date/hooks/useUserDateFormat';
import { type Temporal } from 'temporal-polyfill';
import { formatZonedDateTimeDatePart } from '~/utils/dates/formatZonedDateTimeDatePart';

export const useGetDateFilterDisplayValue = () => {
  const { i18n } = useLingui();
  const { userDateFormat } = useUserDateFormat();

  const getDateFilterDisplayValue = (zonedDateTime: Temporal.ZonedDateTime) => {
    const displayValue = `${formatZonedDateTimeDatePart(zonedDateTime, userDateFormat, i18n.locale)}`;

    return { displayValue };
  };

  return {
    getDateFilterDisplayValue,
  };
};
