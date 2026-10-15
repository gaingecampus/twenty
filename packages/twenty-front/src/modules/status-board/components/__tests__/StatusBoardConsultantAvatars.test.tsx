import { render, screen } from '@testing-library/react';
import { StatusBoardConsultantAvatars } from '@/status-board/components/StatusBoardConsultantAvatars';

jest.mock('@/status-board/components/StatusBoardRecordAvatar', () => ({
  StatusBoardRecordAvatar: () => <span data-testid="member-avatar" />,
}));

it('renders profile names without a runtime theme provider', () => {
  render(
    <StatusBoardConsultantAvatars
      showNames
      objectNameSingular="teamMember"
      members={[{ __typename: 'TeamMember', id: 'member', name: '홍길동' }]}
    />,
  );
  expect(screen.getByText('홍길동')).toBeVisible();
  expect(screen.getByTestId('member-avatar')).toBeVisible();
});
