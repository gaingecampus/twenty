import { getMessageListMemberFilter } from '@/activities/emails/utils/getMessageListMemberFilter';
import { getMessageListMemberEmailFilter } from '@/activities/emails/utils/getMessageListMemberEmailFilter';

it('keeps list and email restrictions when the search is blank', () => {
  expect(getMessageListMemberFilter('list', 'withoutEmail', '  ')).toEqual(
    getMessageListMemberEmailFilter('list', 'withoutEmail'),
  );
});

it('searches customer and workspace member names and email addresses within the selected list and filter', () => {
  expect(getMessageListMemberFilter('list', 'withEmail', ' Luna ')).toEqual({
    and: [
      getMessageListMemberEmailFilter('list', 'withEmail'),
      {
        or: [
          { person: { name: { firstName: { ilike: '%Luna%' } } } },
          { person: { name: { lastName: { ilike: '%Luna%' } } } },
          { person: { emails: { primaryEmail: { ilike: '%Luna%' } } } },
          { workspaceMember: { name: { firstName: { ilike: '%Luna%' } } } },
          { workspaceMember: { name: { lastName: { ilike: '%Luna%' } } } },
          { workspaceMember: { userEmail: { ilike: '%Luna%' } } },
        ],
      },
    ],
  });
});

it('treats wildcard characters in search text literally', () => {
  expect(getMessageListMemberFilter('list', 'all', 'a_b%')).toMatchObject({
    and: [
      { listId: { eq: 'list' } },
      {
        or: expect.arrayContaining([
          { workspaceMember: { userEmail: { ilike: '%a\\_b\\%%' } } },
        ]),
      },
    ],
  });
});
