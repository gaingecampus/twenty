import {
  resolveSmsDeliveryPeople,
  type SmsDeliveryPerson,
} from '@/activities/emails/utils/resolveSmsDeliveryPeople';

const person = (id: string, phone: string, code = ''): SmsDeliveryPerson => ({
  id,
  __typename: 'Person',
  name: { firstName: id, lastName: '' },
  phones: { primaryPhoneNumber: phone, primaryPhoneCallingCode: code },
});
const recipient = { id: 'delivery', phone: '01012345678' };
it.each([
  ['010-1234-5678', ''],
  ['+82 10-1234-5678', ''],
  ['10 1234 5678', '+82'],
])('matches a unique legacy phone with formatting %s', (phone, code) => {
  expect(
    resolveSmsDeliveryPeople(
      [recipient],
      [person('customer', phone, code)],
      true,
    ).get('delivery')?.id,
  ).toBe('customer');
});
it('does not guess when the phone is duplicated or results are incomplete', () => {
  expect(
    resolveSmsDeliveryPeople(
      [recipient],
      [person('a', recipient.phone), person('b', recipient.phone)],
      true,
    ).size,
  ).toBe(0);
  expect(
    resolveSmsDeliveryPeople([recipient], [person('a', recipient.phone)], false)
      .size,
  ).toBe(0);
});
it('prefers saved identities and never reassigns a deleted or inaccessible customer', () => {
  const target = { ...recipient, personId: 'original' };
  expect(
    resolveSmsDeliveryPeople(
      [target],
      [person('original', '01099999999')],
      true,
    ).get('delivery')?.id,
  ).toBe('original');
  expect(
    resolveSmsDeliveryPeople([target], [person('new', recipient.phone)], true)
      .size,
  ).toBe(0);
});
