import { fireEvent, render, screen } from '@testing-library/react';
import { StatusBoardRecordAvatar } from '@/status-board/components/StatusBoardRecordAvatar';

jest.mock('@/object-record/hooks/useRecordChipData', () => ({
  useRecordChipData: ({ record }: { record: { name: string } }) => ({
    recordChipData: { name: record.name, avatarType: 'rounded' },
  }),
}));

it('shows the matching full name on hover for each profile', async () => {
  render(
    <>
      <StatusBoardRecordAvatar
        objectNameSingular="teamMember"
        record={{ __typename: 'TeamMember', id: 'a', name: '김하나' }}
      />
      <StatusBoardRecordAvatar
        objectNameSingular="teamMember"
        record={{ __typename: 'TeamMember', id: 'b', name: '박둘' }}
      />
    </>,
  );
  fireEvent.mouseEnter(screen.getByLabelText('박둘'));
  expect(await screen.findByText('박둘')).toBeVisible();
  expect(screen.queryByText('김하나')).not.toBeInTheDocument();
});
