import { useMessageListRecordPage } from '@/activities/emails/hooks/useMessageListRecordPage';
import {
  normalizeDeliveryPhone,
  resolveSmsDeliveryPeople,
  type SmsDeliveryPerson,
  type SmsDeliveryRecipient,
} from '@/activities/emails/utils/resolveSmsDeliveryPeople';

export const useSmsDeliveryPeople = (recipients: SmsDeliveryRecipient[]) => {
  const ids = recipients.flatMap((recipient) =>
    recipient.personId ? [recipient.personId] : [],
  );
  const phones = [
    ...new Set(
      recipients.flatMap((recipient) => {
        const phone = normalizeDeliveryPhone(recipient.phone);
        return !recipient.personId && phone ? [phone] : [];
      }),
    ),
  ];
  const people = useMessageListRecordPage<SmsDeliveryPerson>({
    objectNameSingular: 'person',
    page: 0,
    pageSize: 1000,
    skip: ids.length === 0 && phones.length === 0,
    filter: {
      or: [
        ...(ids.length ? [{ id: { in: ids } }] : []),
        ...phones.map((phone) => ({
          phones: {
            // Accept separators and +82 in the query, then compare exact normalized numbers.
            primaryPhoneNumber: {
              ilike: `%${phone.slice(1).split('').join('%')}%`,
            },
          },
        })),
      ],
    },
    recordGqlFields: {
      id: true,
      name: true,
      avatarUrl: true,
      phones: true,
    },
  });
  return {
    loading: people.loading,
    peopleByDeliveryId: resolveSmsDeliveryPeople(
      recipients,
      people.records,
      !people.error && people.records.length === people.totalCount,
    ),
  };
};
