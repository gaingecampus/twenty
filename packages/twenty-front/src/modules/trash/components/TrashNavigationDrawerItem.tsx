import { t } from '@lingui/core/macro';
import { useLocation } from 'react-router-dom';
import { IconTrash } from 'twenty-ui/icon';

import { TRASH_APP_PATH } from '@/trash/constants/TrashAppPath';
import { useTrashAccessibleObjectMetadataItems } from '@/trash/hooks/useTrashAccessibleObjectMetadataItems';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { isMatchingLocation } from '~/utils/isMatchingLocation';

export const TrashNavigationDrawerItem = () => {
  const location = useLocation();
  const { hasTrashAccess } = useTrashAccessibleObjectMetadataItems();

  if (!hasTrashAccess) {
    return null;
  }

  return (
    <div data-nav-section="trash">
      <NavigationDrawerItem
        label={t`Trash`}
        Icon={IconTrash}
        to={TRASH_APP_PATH}
        active={isMatchingLocation(location, TRASH_APP_PATH)}
      />
    </div>
  );
};
