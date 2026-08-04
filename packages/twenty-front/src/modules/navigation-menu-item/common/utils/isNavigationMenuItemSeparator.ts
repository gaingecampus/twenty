import { NavigationMenuItemType } from 'twenty-shared/types';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

export const isNavigationMenuItemSeparator = (
  item: Pick<NavigationMenuItem, 'type'>,
) => item.type === NavigationMenuItemType.SEPARATOR;
