import { AuthContext } from '@/auth/contexts/AuthContext';
import { isFieldActorValue } from '@/object-record/record-field/ui/types/guards/isFieldActorValue';
import { ActorDisplay } from '@/ui/field/display/components/ActorDisplay';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';

type TrashDeletedByDisplayProps = {
  deletedBy: unknown;
};

export const TrashDeletedByDisplay = ({
  deletedBy,
}: TrashDeletedByDisplayProps) => {
  const { currentWorkspaceMembers, currentWorkspaceDeletedMembers } =
    useContext(AuthContext);

  if (!isFieldActorValue(deletedBy)) {
    return null;
  }

  const relatedWorkspaceMember = [
    ...(currentWorkspaceMembers ?? []),
    ...(currentWorkspaceDeletedMembers ?? []),
  ].find(
    (workspaceMember) => workspaceMember.id === deletedBy.workspaceMemberId,
  );

  const actorName = isDefined(relatedWorkspaceMember)
    ? `${relatedWorkspaceMember.name.firstName} ${relatedWorkspaceMember.name.lastName}`
    : deletedBy.name;

  return (
    <ActorDisplay
      name={actorName}
      source={deletedBy.source}
      workspaceMemberId={deletedBy.workspaceMemberId}
      context={deletedBy.context}
      avatarUrl={relatedWorkspaceMember?.avatarUrl}
    />
  );
};
