import { NavigationMenuItemType } from 'twenty-shared/types';

import { isNavigationMenuItemSeparator } from '@/navigation-menu-item/common/utils/isNavigationMenuItemSeparator';

describe('isNavigationMenuItemSeparator', () => {
  it('should return true for SEPARATOR items', () => {
    expect(
      isNavigationMenuItemSeparator({ type: NavigationMenuItemType.SEPARATOR }),
    ).toBe(true);
  });

  it('should return false for non-SEPARATOR items', () => {
    expect(
      isNavigationMenuItemSeparator({ type: NavigationMenuItemType.LINK }),
    ).toBe(false);
    expect(
      isNavigationMenuItemSeparator({ type: NavigationMenuItemType.FOLDER }),
    ).toBe(false);
  });
});
