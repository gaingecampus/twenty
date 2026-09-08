import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { getStatusBoardObject } from '@/status-board/utils/getStatusBoardObject';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useMemo } from 'react';

export const useStatusBoardMetadata = () => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  return useMemo(() => {
    const resolve = (nameSingular: string) =>
      getStatusBoardObject({
        objectMetadataItems,
        objectPermissionsByObjectMetadataId,
        nameSingular,
      });

    return {
      opportunity: resolve(STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity),
      company: resolve(STATUS_BOARD_OBJECT_NAME_SINGULAR.company),
      person: resolve(STATUS_BOARD_OBJECT_NAME_SINGULAR.person),
      onboarding: resolve(STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding),
      deposit: resolve(STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit),
      group: resolve(STATUS_BOARD_OBJECT_NAME_SINGULAR.group),
      member: resolve(STATUS_BOARD_OBJECT_NAME_SINGULAR.member),
    };
  }, [objectMetadataItems, objectPermissionsByObjectMetadataId]);
};
