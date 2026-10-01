import { getAvatarUrl } from '@/object-metadata/utils/getAvatarUrl';

describe('linked member profile avatar', () => {
  it.each(['member', 'teamMember'])(
    'uses the linked account for %s without relation metadata',
    (objectName) => {
      expect(
        getAvatarUrl(
          objectName,
          {
            __typename: 'TeamMember',
            id: 'record',
            workspaceMemberAccountId: 'account',
          },
          undefined,
          false,
          [],
          [{ id: 'account', avatarUrl: '/profile.png' }],
        ),
      ).toBe('/profile.png');
    },
  );
  it('does not use another account when there is no linked profile', () => {
    expect(
      getAvatarUrl(
        'teamMember',
        { __typename: 'TeamMember', id: 'record' },
        undefined,
        false,
        [],
        [{ id: 'account', avatarUrl: '/profile.png' }],
      ),
    ).toBe('');
  });
});
