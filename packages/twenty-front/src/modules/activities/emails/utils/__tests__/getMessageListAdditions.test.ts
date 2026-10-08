import { getMessageListAdditions } from '@/activities/emails/utils/getMessageListAdditions';

describe('recipient list additions', () => {
  it('skips existing customers and repeated selections while retaining customers without email', () => {
    const customer = { id: 'new', emails: { primaryEmail: 'a@example.com' } };
    const result = getMessageListAdditions(
      [
        { id: 'existing', emails: { primaryEmail: '' } },
        customer,
        customer,
        { id: 'missing', emails: { primaryEmail: '  ' } },
      ],
      ['existing'],
    );
    expect(result.additions.map((person) => person.id)).toEqual([
      'new',
      'missing',
    ]);
    expect(result.alreadyIncluded).toBe(1);
    expect(result.missingEmail).toBe(1);
  });
  it('does not create anything for an already enrolled selection', () => {
    expect(getMessageListAdditions([{ id: 'existing' }], ['existing'])).toEqual(
      { additions: [], alreadyIncluded: 1, missingEmail: 0 },
    );
  });
});
