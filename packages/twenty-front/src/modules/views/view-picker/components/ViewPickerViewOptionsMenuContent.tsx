import { useCreateManyNavigationMenuItems } from '@/navigation-menu-item/common/hooks/useCreateManyNavigationMenuItems';
import { useDeleteManyNavigationMenuItems } from '@/navigation-menu-item/common/hooks/useDeleteManyNavigationMenuItems';
import { useNavigationMenuItemsData } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemsData';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { type View } from '@/views/types/View';
import { useDestroyViewFromCurrentState } from '@/views/view-picker/hooks/useDestroyViewFromCurrentState';
import { viewPickerReferenceViewIdComponentState } from '@/views/view-picker/states/viewPickerReferenceViewIdComponentState';
import { useLingui } from '@lingui/react/macro';
import { type MouseEvent } from 'react';
import { NavigationMenuItemType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconHeart, IconHeartOff, IconPencil, IconTrash } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  PermissionFlagType,
  ViewVisibility,
} from '~/generated-metadata/graphql';

type ViewPickerViewOptionsMenuContentProps = {
  isIndexView: boolean;
  isLastView: boolean;
  view: Pick<View, 'id' | 'visibility' | 'createdByUserWorkspaceId'>;
  dropdownId: string;
  onEdit: (event: MouseEvent<HTMLElement>, viewId: string) => void;
};

export const ViewPickerViewOptionsMenuContent = ({
  isIndexView,
  isLastView,
  view,
  dropdownId,
  onEdit,
}: ViewPickerViewOptionsMenuContentProps) => {
  const { t } = useLingui();
  const { closeDropdown } = useCloseDropdown();
  const { destroyViewFromCurrentState } = useDestroyViewFromCurrentState();
  const setViewPickerReferenceViewId = useSetAtomComponentState(
    viewPickerReferenceViewIdComponentState,
  );
  const hasViewsPermission = useHasPermissionFlag(PermissionFlagType.VIEWS);

  const { createManyNavigationMenuItems } = useCreateManyNavigationMenuItems();
  const { navigationMenuItems, currentUserWorkspaceId } =
    useNavigationMenuItemsData();

  const { deleteManyNavigationMenuItems } = useDeleteManyNavigationMenuItems();

  const canEditView =
    hasViewsPermission || view.visibility === ViewVisibility.UNLISTED;

  const currentNavigationMenuItem = navigationMenuItems.find(
    (item) =>
      item.viewId === view.id &&
      item.userWorkspaceId === currentUserWorkspaceId,
  );
  const isFavorite = isDefined(currentNavigationMenuItem);

  const handleDelete = () => {
    setViewPickerReferenceViewId(view.id);
    destroyViewFromCurrentState();
    closeDropdown(dropdownId);
  };

  const handleToggleFavorite = () => {
    if (!isFavorite) {
      const relevantItems = navigationMenuItems.filter(
        (item) => !isDefined(item.folderId) && isDefined(item.userWorkspaceId),
      );

      const maxPosition = Math.max(
        ...relevantItems.map((item) => item.position),
        0,
      );

      createManyNavigationMenuItems([
        {
          id: uuidv4(),
          type: NavigationMenuItemType.VIEW,
          viewId: view.id,
          userWorkspaceId: currentUserWorkspaceId,
          position: maxPosition + 1,
        },
      ]);
    } else {
      deleteManyNavigationMenuItems([currentNavigationMenuItem.id]);
    }
    closeDropdown(dropdownId);
  };

  return (
    <DropdownContent>
      <DropdownMenuItemsContainer>
        <MenuItem
          LeftIcon={isFavorite ? IconHeartOff : IconHeart}
          text={isFavorite ? t`Remove Favorite` : t`Add to Favorite`}
          onClick={handleToggleFavorite}
        />
        {!isIndexView && canEditView && (
          <>
            <MenuItem
              LeftIcon={IconPencil}
              text={t`Edit`}
              onClick={(event) => {
                onEdit(event, view.id);
                closeDropdown(dropdownId);
              }}
            />
            {!isLastView && (
              <MenuItem
                LeftIcon={IconTrash}
                text={t`Delete`}
                onClick={handleDelete}
                accent="danger"
              />
            )}
          </>
        )}
      </DropdownMenuItemsContainer>
    </DropdownContent>
  );
};
