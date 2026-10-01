import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';

import { SidePanelPageInfoLayout } from '@/side-panel/components/SidePanelPageInfoLayout';
import { NavigationMenuItemIcon } from '@/navigation-menu-item/display/components/NavigationMenuItemIcon';
import { NavigationMenuItemType } from 'twenty-shared/types';
import { useSelectedNavigationMenuItemEditItem } from '@/navigation-menu-item/edit/hooks/useSelectedNavigationMenuItemEditItem';
import { useSelectedNavigationMenuItemEditItemLabel } from '@/navigation-menu-item/edit/hooks/useSelectedNavigationMenuItemEditItemLabel';
import { useSelectedNavigationMenuItemEditItemObjectMetadata } from '@/navigation-menu-item/edit/hooks/useSelectedNavigationMenuItemEditItemObjectMetadata';

const StyledHeaderIcon = styled.div`
  --t-avatar-size-md: 24px;
  --t-avatar-size-sm: 24px;
  --tinted-icon-tile-dimension: 24px;
  align-items: center;
  display: flex;
  height: 24px;
  justify-content: center;
  width: 24px;

  svg {
    height: 20px;
    width: 20px;
  }
`;

export const SidePanelObjectViewRecordInfo = () => {
  const { t } = useLingui();
  const { selectedItem } = useSelectedNavigationMenuItemEditItem();
  const { selectedItemLabel } = useSelectedNavigationMenuItemEditItemLabel();
  const { selectedItemObjectMetadata } =
    useSelectedNavigationMenuItemEditItemObjectMetadata();

  const navItem =
    selectedItem && selectedItem.type !== NavigationMenuItemType.FOLDER
      ? selectedItem
      : undefined;

  if (!navItem || !selectedItemLabel) {
    return null;
  }

  const isObjectViewOrRecord = [
    NavigationMenuItemType.OBJECT,
    NavigationMenuItemType.VIEW,
    NavigationMenuItemType.RECORD,
  ].includes(navItem.type);

  if (!isObjectViewOrRecord) {
    return null;
  }

  const label =
    navItem.type === NavigationMenuItemType.RECORD
      ? selectedItemObjectMetadata?.labelSingular
      : navItem.type === NavigationMenuItemType.OBJECT
        ? t`Object`
        : t`View`;

  return (
    <SidePanelPageInfoLayout
      icon={
        <StyledHeaderIcon>
          <NavigationMenuItemIcon navigationMenuItem={navItem} />
        </StyledHeaderIcon>
      }
      title={<OverflowingTextWithTooltip text={selectedItemLabel} />}
      label={label}
    />
  );
};
