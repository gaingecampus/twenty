import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MenuFavoriteButton } from '@/navigation-menu-item/display/components/MenuFavoriteButton';

const mockCreate = jest.fn();
const mockDelete = jest.fn();
const mockOpen = jest.fn();
const mockError = jest.fn();
const mockData = jest.fn();
jest.mock(
  '@/navigation-menu-item/common/hooks/useCreateManyNavigationMenuItems',
  () => ({
    useCreateManyNavigationMenuItems: () => ({
      createManyNavigationMenuItems: mockCreate,
    }),
  }),
);
jest.mock(
  '@/navigation-menu-item/common/hooks/useDeleteManyNavigationMenuItems',
  () => ({
    useDeleteManyNavigationMenuItems: () => ({
      deleteManyNavigationMenuItems: mockDelete,
    }),
  }),
);
jest.mock(
  '@/navigation-menu-item/display/hooks/useNavigationMenuItemsData',
  () => ({
    useNavigationMenuItemsData: () => mockData(),
  }),
);
jest.mock(
  '@/ui/navigation/navigation-drawer/hooks/useNavigationSection',
  () => ({
    useNavigationSection: () => ({ openNavigationSection: mockOpen }),
  }),
);
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({ enqueueErrorSnackBar: mockError }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue([]);
  mockDelete.mockResolvedValue(undefined);
  mockData.mockReturnValue({
    currentUserWorkspaceId: 'me',
    navigationMenuItems: [],
  });
});
it('saves a personal menu link and opens favorites', async () => {
  render(<MenuFavoriteButton label="메일함" path="/mailbox" icon="IconMail" />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(mockOpen).toHaveBeenCalled());
  expect(mockCreate).toHaveBeenCalledWith([
    expect.objectContaining({
      userWorkspaceId: 'me',
      type: 'LINK',
      link: `${window.location.origin}/mailbox`,
      name: '메일함',
      icon: 'IconMail',
      position: -1,
    }),
  ]);
});
it('removes only this user’s matching object favorite', async () => {
  mockData.mockReturnValue({
    currentUserWorkspaceId: 'me',
    navigationMenuItems: [
      {
        id: 'mine',
        userWorkspaceId: 'me',
        type: 'OBJECT',
        targetObjectMetadataId: 'company',
        position: 0,
      },
      {
        id: 'other',
        userWorkspaceId: 'other',
        type: 'OBJECT',
        targetObjectMetadataId: 'company',
        position: 1,
      },
      {
        id: 'record',
        userWorkspaceId: 'me',
        type: 'RECORD',
        targetObjectMetadataId: 'company',
        position: 2,
      },
    ],
  });
  render(
    <MenuFavoriteButton
      label="기업"
      path="/objects/companies"
      objectMetadataId="company"
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '기업 즐겨찾기 해제' }));
  await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(['mine']));
  expect(mockCreate).not.toHaveBeenCalled();
});
it('disables repeat clicks while saving and reports failure', async () => {
  let rejectSave: (error: Error) => void = () => undefined;
  mockCreate.mockReturnValue(
    new Promise((_, reject) => {
      rejectSave = reject;
    }),
  );
  render(<MenuFavoriteButton label="메일함" path="/mailbox" />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('button')).toBeDisabled();
  fireEvent.click(screen.getByRole('button'));
  expect(mockCreate).toHaveBeenCalledTimes(1);
  rejectSave(new Error('offline'));
  await waitFor(() => expect(mockError).toHaveBeenCalled());
  expect(screen.getByRole('button')).toBeEnabled();
  expect(mockOpen).not.toHaveBeenCalled();
});
