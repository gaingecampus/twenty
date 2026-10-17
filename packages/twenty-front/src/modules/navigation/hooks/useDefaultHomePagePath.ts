import { currentUserState } from '@/auth/states/currentUserState';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { filterReadableActiveObjectMetadataItems } from '@/object-metadata/utils/filterReadableActiveObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';

export const useDefaultHomePagePath = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );
  const { activeObjectMetadataItems } = useFilteredObjectMetadataItems();

  if (!isDefined(currentUser)) {
    return { defaultHomePagePath: AppPath.SignInUp };
  }

  // Wait for workspace metadata before deciding whether the user has access.
  if (metadataStore.status !== 'up-to-date') {
    return { defaultHomePagePath: AppPath.Index };
  }

  const hasReadableObjects = filterReadableActiveObjectMetadataItems(
    activeObjectMetadataItems,
    objectPermissionsByObjectMetadataId,
  ).some((item) => !item.isSystem);

  return {
    defaultHomePagePath: hasReadableObjects
      ? '/consulting-quality'
      : getSettingsPath(SettingsPath.ProfilePage),
  };
};
