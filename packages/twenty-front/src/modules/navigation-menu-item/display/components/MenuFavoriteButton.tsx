import { useState } from 'react';
import { NavigationMenuItemType } from 'twenty-shared/types';
import { IconHeart, IconHeartOff } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { useCreateManyNavigationMenuItems } from '@/navigation-menu-item/common/hooks/useCreateManyNavigationMenuItems';
import { useDeleteManyNavigationMenuItems } from '@/navigation-menu-item/common/hooks/useDeleteManyNavigationMenuItems';
import { useNavigationMenuItemsData } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemsData';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const MenuFavoriteButton = ({
  label,
  path,
  icon,
  objectMetadataId,
  viewId,
}: {
  label: string;
  path: string;
  icon?: string;
  objectMetadataId?: string;
  viewId?: string;
}) => {
  const { navigationMenuItems, currentUserWorkspaceId } =
    useNavigationMenuItemsData();
  const { createManyNavigationMenuItems } = useCreateManyNavigationMenuItems();
  const { deleteManyNavigationMenuItems } = useDeleteManyNavigationMenuItems();
  const { openNavigationSection } = useNavigationSection('Favorites');
  const { enqueueErrorSnackBar } = useSnackBar();
  const [pending, setPending] = useState(false);
  const link = new URL(path, window.location.origin).href;
  const favorites = navigationMenuItems.filter(
    (item) =>
      item.userWorkspaceId === currentUserWorkspaceId &&
      (viewId
        ? item.type === NavigationMenuItemType.VIEW && item.viewId === viewId
        : objectMetadataId
          ? item.type === NavigationMenuItemType.OBJECT &&
            item.targetObjectMetadataId === objectMetadataId
          : item.type === NavigationMenuItemType.LINK && item.link === link),
  );
  const pinned = favorites.length > 0;
  const title = `${label} 즐겨찾기 ${pinned ? '해제' : '추가'}`;

  const toggleFavorite = async () => {
    if (pending || !currentUserWorkspaceId) return;
    setPending(true);
    try {
      if (pinned) {
        await deleteManyNavigationMenuItems(favorites.map((item) => item.id));
      } else {
        await createManyNavigationMenuItems([
          {
            userWorkspaceId: currentUserWorkspaceId,
            position:
              Math.min(0, ...navigationMenuItems.map((item) => item.position)) -
              1,
            ...(viewId
              ? { type: NavigationMenuItemType.VIEW, viewId }
              : objectMetadataId
                ? {
                    type: NavigationMenuItemType.OBJECT,
                    targetObjectMetadataId: objectMetadataId,
                  }
                : {
                    type: NavigationMenuItemType.LINK,
                    link,
                    name: label,
                    icon,
                  }),
          },
        ]);
        openNavigationSection();
      }
    } catch {
      enqueueErrorSnackBar({
        message: '즐겨찾기를 저장하지 못했어요. 다시 시도해 주세요.',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <LightIconButton
      Icon={pinned ? IconHeartOff : IconHeart}
      aria-label={title}
      title={title}
      active={pinned}
      disabled={pending || !currentUserWorkspaceId}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFavorite();
      }}
    />
  );
};
