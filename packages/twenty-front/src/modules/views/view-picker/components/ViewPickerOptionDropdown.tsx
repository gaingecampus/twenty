import { MenuItemWithOptionDropdown } from '@/ui/navigation/menu-item/components/MenuItemWithOptionDropdown';
import { type View } from '@/views/types/View';
import { ViewPickerViewOptionsMenuContent } from '@/views/view-picker/components/ViewPickerViewOptionsMenuContent';
import { IconLock, useIcons } from 'twenty-ui/icon';

type ViewPickerOptionDropdownProps = {
  isIndexView: boolean;
  isLastView: boolean;
  view: Pick<
    View,
    'id' | 'name' | 'icon' | 'visibility' | 'createdByUserWorkspaceId'
  >;
  onEdit: (event: React.MouseEvent<HTMLElement>, viewId: string) => void;
  handleViewSelect: (viewId: string) => void;
  isCurrentView: boolean;
};

export const ViewPickerOptionDropdown = ({
  isIndexView,
  isLastView,
  onEdit,
  view,
  handleViewSelect,
  isCurrentView,
}: ViewPickerOptionDropdownProps) => {
  const dropdownId = `view-picker-options-${view.id}`;
  const { getIcon } = useIcons();

  const getVisibilityIcon = () => {
    if (isIndexView) {
      return IconLock;
    }

    return null;
  };

  const shouldShowIconAlways = isIndexView;

  return (
    <MenuItemWithOptionDropdown
      text={view.name}
      LeftIcon={getIcon(view.icon)}
      onClick={() => handleViewSelect(view.id)}
      isIconDisplayedOnHoverOnly={!shouldShowIconAlways}
      RightIcon={getVisibilityIcon()}
      dropdownPlacement="bottom-start"
      dropdownId={dropdownId}
      selected={isCurrentView}
      dropdownContent={
        <ViewPickerViewOptionsMenuContent
          view={view}
          isIndexView={isIndexView}
          isLastView={isLastView}
          dropdownId={dropdownId}
          onEdit={onEdit}
        />
      }
    />
  );
};
