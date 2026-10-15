import { isNonEmptyString } from '@sniptt/guards';
import { type ComponentProps, type ReactNode } from 'react';
import { IconArrowUpRight, type IconComponent } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';

import { useCommandMenuOnItemClick } from '@/command-menu/hooks/useCommandMenuOnItemClick';
import { isSelectedItemIdComponentFamilyState } from '@/ui/layout/selectable-list/states/isSelectedItemIdComponentFamilyState';
import { useAtomComponentFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateValue';
import { type Nullable } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type CommandMenuItemProps = {
  accent?: ComponentProps<typeof MenuItem>['accent'];
  label: string;
  description?: string;
  to?: string;
  id: string;
  onClick?: () => void;
  Icon?: IconComponent;
  hotKeys?: Nullable<string[]>;
  LeftComponent?: ReactNode;
  RightComponent?: ReactNode;
  contextualTextPosition?: 'left' | 'right';
  hasSubMenu?: boolean;
  isSubMenuOpened?: boolean;
  disabled?: boolean;
};

export const CommandMenuItem = ({
  accent = 'default',
  label,
  description,
  contextualTextPosition = 'left',
  to,
  id,
  onClick,
  Icon,
  hotKeys,
  LeftComponent,
  RightComponent,
  hasSubMenu = false,
  isSubMenuOpened = false,
  disabled = false,
}: CommandMenuItemProps) => {
  const { onItemClick } = useCommandMenuOnItemClick();

  if (isNonEmptyString(to) && !Icon) {
    Icon = IconArrowUpRight;
  }

  const isSelectedItemId = useAtomComponentFamilyStateValue(
    isSelectedItemIdComponentFamilyState,
    id,
  );

  return (
    <MenuItem
      accent={accent}
      withIconContainer={!isDefined(LeftComponent)}
      LeftIcon={isDefined(LeftComponent) ? undefined : Icon}
      LeftComponent={LeftComponent}
      text={label}
      contextualText={description}
      contextualTextPosition={contextualTextPosition}
      hotKeys={hotKeys}
      onClick={
        onClick || to
          ? () =>
              onItemClick({
                onClick,
                to,
              })
          : undefined
      }
      focused={!disabled && isSelectedItemId}
      RightComponent={RightComponent}
      hasSubMenu={hasSubMenu}
      isSubMenuOpened={isSubMenuOpened}
      disabled={disabled}
    />
  );
};
