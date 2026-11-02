import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type SmsDeliveryPerson = ObjectRecord & {
  name: { firstName: string; lastName: string };
  avatarUrl?: string | null;
  phones?: {
    primaryPhoneNumber?: string;
    primaryPhoneCallingCode?: string;
  };
};

export type SmsDeliveryRecipient = {
  id: string;
  personId?: string | null;
  phone: string;
};

export const normalizeDeliveryPhone = (value: string, callingCode = '') => {
  let phone = value.trim().replace(/[\s()-]/g, '');
  if (callingCode === '+82' && !phone.startsWith('0') && !phone.startsWith('+'))
    phone = `+82${phone}`;
  if (phone.startsWith('+82')) phone = `0${phone.slice(3)}`;
  return /^01[016789]\d{7,8}$/.test(phone) ? phone : undefined;
};

export const resolveSmsDeliveryPeople = (
  recipients: SmsDeliveryRecipient[],
  people: SmsDeliveryPerson[],
  isComplete: boolean,
) => {
  const byId = new Map(people.map((person) => [person.id, person]));
  const byPhone = new Map<string, SmsDeliveryPerson[]>();
  for (const person of people) {
    const phone = normalizeDeliveryPhone(
      person.phones?.primaryPhoneNumber ?? '',
      person.phones?.primaryPhoneCallingCode,
    );
    if (phone) byPhone.set(phone, [...(byPhone.get(phone) ?? []), person]);
  }
  const result = new Map<string, SmsDeliveryPerson>();
  for (const recipient of recipients) {
    // A saved identity must never be reassigned when a phone number is reused.
    const matches = recipient.personId
      ? [byId.get(recipient.personId)]
      : isComplete
        ? (byPhone.get(normalizeDeliveryPhone(recipient.phone) ?? '') ?? [])
        : [];
    if (matches.length === 1 && matches[0])
      result.set(recipient.id, matches[0]);
  }
  return result;
};
