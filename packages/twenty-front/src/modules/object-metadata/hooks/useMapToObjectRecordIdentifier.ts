import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const useMapToObjectRecordIdentifier = ({
  objectNameSingular,
  allowRequestsToTwentyIcons,
}: {
  objectNameSingular: string;
  allowRequestsToTwentyIcons: boolean;
}) => {
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const mapToObjectRecordIdentifier = (record: ObjectRecord) => {
    return getObjectRecordIdentifier({
      objectMetadataItem,
      record,
      allowRequestsToTwentyIcons,
      workspaceMembers: currentWorkspaceMembers,
    });
  };

  return { mapToObjectRecordIdentifier };
};
