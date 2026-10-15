import { getWorkspaceMemberRecipients } from '@/activities/emails/utils/getWorkspaceMemberRecipients';
import { getMessageListAdditions } from '@/activities/emails/utils/getMessageListAdditions';

const members = [
  { id: 'self', userEmail: 'self@example.com' },
  { id: 'colleague', userEmail: 'colleague@example.com' },
  { id: 'no-email', userEmail: null },
];

it('excludes the current member and uses workspace email for recipients', () => {
  const recipients = getWorkspaceMemberRecipients(members, 'self');
  expect(recipients.map((member) => member.id)).toEqual([
    'colleague',
    'no-email',
  ]);
  expect(recipients[0].emails.primaryEmail).toBe('colleague@example.com');
  expect(getMessageListAdditions(recipients, ['colleague'])).toMatchObject({
    alreadyIncluded: 1,
    missingEmail: 1,
  });
});

it('offers no recipients until the current member is known', () => {
  expect(getWorkspaceMemberRecipients(members, undefined)).toEqual([]);
});
